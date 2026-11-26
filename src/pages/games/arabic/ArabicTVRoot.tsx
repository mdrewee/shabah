import { recalculateArabicRound } from './arabicScoring';
import { useGameState } from '../../../hooks/useGameState';
import { ShabahThinkingScreen } from '../../../components/common/ShabahThinkingScreen';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom, roomBus } from '../../../lib/roomBus';
import { useRoomSync } from '../../../hooks/useRoomSync';
import { sound } from '../../../lib/audio';
import { UnifiedShabahLobby } from '../../../components/lobby/UnifiedShabahLobby';
import { ArabicRoomState, ObjectionState, ContestantEvaluation } from './types';
import {
  createInitialArabicState,
  savePersistedArabicState,
  clearPersistedArabicState,
  getRankedContestants,
} from './arabicSync';
import {
  getNextUniqueLetter,
  getNextUniqueCategories,
  normalizeArabicLetter,
  WEIGHTED_LETTERS,
} from '../../../data/arabicCategories';
import {
  evaluateAllArabicAnswers,
  PlayerArabicEvaluation,
} from '../../../services/arabicEngine';
import { ArabicRouletteStage } from './components/ArabicRouletteStage';
import { ArabicTVResults } from './components/ArabicTVResults';
import { ArabicFinalPodium } from './components/ArabicFinalPodium';
import { Clock } from 'lucide-react';

export const ArabicTVRoot: React.FC<{ mobileContestants?: Array<{ id: string; name: string }>; onNextRoundReady?:(advance:()=>void)=>void }> = ({ mobileContestants,onNextRoundReady }) => {
  const { code: rawCode } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const roomCode = (rawCode || 'SHBH').trim().toUpperCase();

  const { room } = useRoom(roomCode);
  const activeRoom = room || roomBus.getRoom(roomCode);

  // Realtime presence connection for Host TV
  const { connectedPlayers: realtimeContestants, hasPresenceSnapshot } = useRoomSync({
    roomCode: mobileContestants ? '' : roomCode,
    role: 'host',
  });

  const [arabicState, setArabicState, stateRef] = useGameState<ArabicRoomState>(() =>
    createInitialArabicState(roomCode)
  );

  const analysisGeneration = useRef(0);

  useEffect(() => roomBus.on('REQUEST_ROOM_STATE', () => {
    roomBus.broadcastArabicSync(roomCode, stateRef.current);
  }, roomCode), [roomCode]);
  useEffect(() => {
    stateRef.current = arabicState;
    savePersistedArabicState(roomCode, arabicState);
  }, [arabicState, roomCode]);

  // Merged connected contestants
  const mergedContestants = mobileContestants ?? (
    hasPresenceSnapshot || realtimeContestants.length > 0
      ? realtimeContestants
      : (activeRoom?.players || []).filter((p) => p.id !== 'host_tv'));

  // Synchronize state to mobile contestants
  const syncState = useCallback(
    (newState: ArabicRoomState) => {
      stateRef.current = newState;
      setArabicState(newState);
      roomBus.broadcastArabicSync(roomCode, newState);
    },
    [roomCode]
  );

  // -------------------------------------------------------------
  // Round Transitions
  // -------------------------------------------------------------

  const startRoundRoulette = useCallback(() => {
    const curr = stateRef.current;
    const { letter: nextLetter, updatedPlayed } = getNextUniqueLetter(curr.usedLetters || []);
    const { categories: nextCategories, updatedUsedCategories } = getNextUniqueCategories(
      5,
      curr.usedCategories || []
    );

    const nextState: ArabicRoomState = {
      ...curr,
      phase: 'ROULETTE',
      currentLetter: nextLetter,
      usedLetters: updatedPlayed,
      currentCategories: nextCategories,
      usedCategories: updatedUsedCategories,
      submissions: {},
      evaluations: {},
      activeObjection: null,
      readyPlayersNextRound: [],
      timerSeconds: 60,
    };
    syncState(nextState);
  }, [syncState]);

  const startRoundInput = useCallback(() => {
    const curr = stateRef.current;
    const nextState: ArabicRoomState = {
      ...curr,
      phase: 'INPUT',
      timerSeconds: 60,
      roundStartedAt: Date.now(),
      submissions: {},
      evaluations: {},
      activeObjection: null,
      readyPlayersNextRound: [],
    };
    syncState(nextState);
  }, [syncState]);

  const executeJudging = useCallback(async (overrideSubmissions?: Record<string, any>, resume = false) => {
    const curr = stateRef.current;
    if (curr.phase !== 'INPUT' && !(resume && curr.phase === 'JUDGING')) return;
    const generation = ++analysisGeneration.current;

    sound.playTick();
    const judgingState: ArabicRoomState = {
      ...curr,
      phase: 'JUDGING',
    };
    stateRef.current = judgingState;
    syncState(judgingState);

    const subs = overrideSubmissions || curr.submissions || {};
    const submissionsList: Array<{ playerId: string; playerName: string; answers: Record<string, string> }> = [];
    const processedIds = new Set<string>();

    // 1. Gather all connected contestants
    mergedContestants.forEach((c) => {
      processedIds.add(c.id);
      const sub =
        subs[c.id] ||
        Object.values(subs).find(
          (s: any) =>
            s.contestantId === c.id ||
            s.playerId === c.id ||
            (s.contestantName && c.name && s.contestantName.trim().toLowerCase() === c.name.trim().toLowerCase())
        );

      submissionsList.push({
        playerId: c.id,
        playerName: c.name,
        answers: sub?.answers || {},
      });
    });

    // 2. Safety net: include any submissions received whose ID was not in mergedContestants
    Object.values(subs).forEach((s: any) => {
      const sId = s.contestantId || s.playerId;
      if (sId && !processedIds.has(sId)) {
        processedIds.add(sId);
        submissionsList.push({
          playerId: sId,
          playerName: s.contestantName || s.playerName || 'متسابق',
          answers: s.answers || {},
        });
      }
    });

    // Run batch evaluation via Gemini 2.0 Flash (with local linguistic fallback)
    const playerEvals = await evaluateAllArabicAnswers(
      curr.currentLetter,
      curr.currentCategories,
      submissionsList
    );

    if (generation !== analysisGeneration.current) return;
    // Update cumulative scores & legacy format
    const updatedCumulative = { ...(curr.cumulativeScores || {}) };
    const legacyEvals: Record<string, ContestantEvaluation> = {};

    playerEvals.forEach((pe) => {
      updatedCumulative[pe.playerId] = (updatedCumulative[pe.playerId] || 0) + pe.totalScore;
      legacyEvals[pe.playerId] = {
        contestantId: pe.playerId,
        contestantName: pe.playerName,
        totalRoundPoints: pe.totalScore,
        roundPoints: pe.totalScore,
        speedBonus: 0,
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

    const resultsState: ArabicRoomState = {
      ...curr,
      phase: 'RESULTS',
      evaluations: legacyEvals,
      playerEvaluations: playerEvals,
      cumulativeScores: updatedCumulative,
      readyPlayersNextRound: [],
    };
    Object.assign(resultsState, recalculateArabicRound({ ...curr, submissions: subs }, legacyEvals));
    stateRef.current = resultsState;
    syncState(resultsState);

    // Broadcast definitive ARABIC_RESULTS_READY with full batch array to mobile contestants
    roomBus.broadcastArabicResultsReady(roomCode, {
      evaluations: resultsState.playerEvaluations,
      roundNumber: curr.roundNumber,
    });

    sound.playVictory();
  }, [mergedContestants, roomCode, syncState]);

  const resumedAnalysis = useRef(arabicState.phase === 'JUDGING');
  useEffect(() => {
    if (!resumedAnalysis.current) return;
    const timer = window.setTimeout(() => {
      resumedAnalysis.current = false;
      void executeJudging(undefined, true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [executeJudging]);
  useEffect(() => () => { ++analysisGeneration.current; }, []);

  const handleNextRound = useCallback(() => {
    const curr = stateRef.current;
    if(curr.phase!=='RESULTS')return;
    if (curr.activeObjection && !curr.activeObjection.resolved) return;
    if (curr.roundNumber >= curr.totalRounds) {
      // Advance to Final Podium
      const podiumState: ArabicRoomState = {
        ...curr,
        phase: 'PODIUM',
      };
      syncState(podiumState);
      sound.playVictory();
      return;
    }

    // Pick new unique letter and categories
    const { letter: nextLetter, updatedPlayed } = getNextUniqueLetter(curr.usedLetters || []);
    const { categories: nextCategories, updatedUsedCategories } = getNextUniqueCategories(
      5,
      curr.usedCategories || []
    );

    const nextRoundState: ArabicRoomState = {
      ...curr,
      phase: 'ROULETTE',
      roundNumber: curr.roundNumber + 1,
      currentLetter: nextLetter,
      usedLetters: updatedPlayed,
      currentCategories: nextCategories,
      usedCategories: updatedUsedCategories,
      timerSeconds: 60,
      submissions: {},
      evaluations: {},
      activeObjection: null,
      readyPlayersNextRound: [],
    };
    syncState(nextRoundState);
  }, [syncState]);

  const handleExtendRounds = useCallback(() => {
    const curr = stateRef.current;
    const { letter: nextLetter, updatedPlayed } = getNextUniqueLetter(curr.usedLetters || []);
    const { categories: nextCategories, updatedUsedCategories } = getNextUniqueCategories(
      5,
      curr.usedCategories || []
    );

    const nextRoundState: ArabicRoomState = {
      ...curr,
      phase: 'ROULETTE',
      roundNumber: curr.roundNumber + 1,
      totalRounds: curr.totalRounds + 5,
      currentLetter: nextLetter,
      usedLetters: updatedPlayed,
      currentCategories: nextCategories,
      usedCategories: updatedUsedCategories,
      timerSeconds: 60,
      submissions: {},
      evaluations: {},
      activeObjection: null,
      readyPlayersNextRound: [],
    };
    syncState(nextRoundState);
  }, [syncState]);

  const handleEndGame = useCallback(async () => {
    if (!await roomBus.terminateRoom(roomCode)) {
      alert('تعذر إنهاء الغرفة، حاول مرة أخرى');
      return;
    }
  }, [roomCode]);

  const handleReturnToLobby = useCallback(() => {
    if (!window.confirm('ترجع للوبي وتنهي الجولة؟')) return;
    clearPersistedArabicState(roomCode);
    const nextState: ArabicRoomState = {
      ...createInitialArabicState(roomCode),
      phase: 'LOBBY',
      roundNumber: 1,
      usedLetters: [],
      usedCategories: [],
    };
    roomBus.broadcastReturnToLobby(roomCode);
    syncState(nextState);
  }, [roomCode, syncState]);

  // -------------------------------------------------------------
  // Countdown Timer for INPUT Phase
  // -------------------------------------------------------------
  useEffect(() => {
    if (arabicState.phase !== 'INPUT') return;

    let graceTimer: ReturnType<typeof setTimeout> | undefined;
    const interval = setInterval(() => {
      const prev = stateRef.current;
      if (prev.phase !== 'INPUT') return;
      const nextSec = Math.max(0, Math.ceil((prev.roundStartedAt + 60000 - Date.now()) / 1000));
      syncState({ ...prev, timerSeconds: nextSec });
      if (nextSec === 0) {
        clearInterval(interval);
        roomBus.broadcastArabicTimeUp(roomCode);
        graceTimer = setTimeout(() => { void executeJudging(); }, 1500);
      } else if (nextSec <= 5) sound.playTick();
    }, 1000);
    return () => { clearInterval(interval); if (graceTimer) clearTimeout(graceTimer); };
  }, [arabicState.phase, executeJudging, roomCode, syncState]);

  // -------------------------------------------------------------
  // Realtime Broadcast Listeners
  // -------------------------------------------------------------
  useEffect(() => {
    // 1. Contestant Submits Answers (supports both ARABIC_SUBMIT_ANSWERS & SUBMIT_ARABIC_ANSWERS)
    const handleIncomingSubmission = (evt: any) => {
      const incomingCode = evt?.roomCode;
      const payload = evt?.data ?? evt;
      if (incomingCode && incomingCode !== roomCode) return;
      if (!payload) return;

      const curr = stateRef.current;
      if (curr.phase !== 'INPUT') return;

      const contestantId = String(payload.contestantId || payload.playerId || '');
      const contestantName = mergedContestants.find(c => c.id === contestantId)?.name || 'متسابق';
      if (!contestantId || curr.submissions[contestantId] || !mergedContestants.some(c => c.id === contestantId)) return;
      if (payload.roundNumber !== curr.roundNumber) return;
      if (!payload.answers || typeof payload.answers !== 'object' || Object.values(payload.answers).some(a => typeof a !== 'string' || a.length > 160)) return;

      const updatedSubmissions = {
        ...curr.submissions,
        [contestantId]: {
          contestantId,
          contestantName,
          answers: payload.answers || {},
          finishedAt: payload.finishedAt || Date.now(),
          submissionDurationMs: Math.max(1, Date.now() - curr.roundStartedAt),
        },
      };

      const updatedState = {
        ...curr,
        submissions: updatedSubmissions,
      };

      stateRef.current = updatedState;

      // Check early advance: if all connected contestants submitted
      const connectedCount = Math.max(1, mergedContestants.length);
      const submittedCount = mergedContestants.filter(c => updatedSubmissions[c.id]).length;

      if (submittedCount >= connectedCount) {
        setArabicState(updatedState);
        roomBus.broadcastArabicSync(roomCode, updatedState);
        executeJudging(updatedSubmissions);
      } else {
        syncState(updatedState);
      }
    };

    const unsubAnswers1 = roomBus.on('ARABIC_SUBMIT_ANSWERS', handleIncomingSubmission);
    const unsubAnswers2 = roomBus.on('SUBMIT_ARABIC_ANSWERS', handleIncomingSubmission);

    // 2. Contestant Files Objection (Supports ARABIC_OBJECTION_RAISED and ARABIC_OBJECTION_FILED)
    const handleIncomingObjection = (evt: any) => {
      const incomingCode = evt?.roomCode;
      const payload = evt?.data ?? evt;
      if (incomingCode && incomingCode !== roomCode) return;
      if (!payload) return;

      const curr = stateRef.current;
      if (curr.phase !== 'RESULTS') return;

      // Ignore if an objection is already active and unresolved
      if (curr.activeObjection && !curr.activeObjection.resolved) return;

      if (payload.roundNumber !== curr.roundNumber) return;
      if (!mergedContestants.some(c => c.id === payload.contestantId)) return;
      sound.playNotification?.();

      const catIdx =
        typeof payload.categoryIndex === 'number'
          ? payload.categoryIndex
          : payload.category
          ? curr.currentCategories.indexOf(payload.category)
          : 0;

      const submittedAnswer = curr.evaluations[payload.contestantId]?.answers[catIdx];
      if (!submittedAnswer || submittedAnswer.isValid || submittedAnswer.objected || !submittedAnswer.rawAnswer) return;
      const objection: ObjectionState = {
        id: `obj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        contestantId: payload.contestantId,
        contestantName: payload.contestantName,
        categoryIndex: catIdx >= 0 ? catIdx : 0,
        categoryName: payload.category || curr.currentCategories[catIdx] || '',
        answer: submittedAnswer.rawAnswer,
        votesFor: [],
        votesAgainst: [],
        endsAt: Date.now() + 10500, // 10 seconds live voting window
        resolved: false,
      };

      // Mark answer as objected
      const updatedEvals = { ...curr.evaluations };
      if (updatedEvals[payload.contestantId]?.answers[objection.categoryIndex]) {
        updatedEvals[payload.contestantId].answers[objection.categoryIndex].objected = true;
      }

      const updatedState: ArabicRoomState = {
        ...curr,
        activeObjection: objection,
        evaluations: updatedEvals,
      };
      stateRef.current = updatedState;
      syncState(updatedState);
      roomBus.safeBroadcast(roomCode, 'ARABIC_OBJECTION_RAISED', objection);
    };

    const unsubObjection1 = roomBus.on('ARABIC_OBJECTION_FILED', handleIncomingObjection);
    const unsubObjection2 = roomBus.on('ARABIC_OBJECTION_RAISED', handleIncomingObjection);

    // 3. Contestant Votes on Objection
    const unsubVote = roomBus.on('ARABIC_OBJECTION_VOTE', (evt: any) => {
      const incomingCode = evt?.roomCode;
      const payload = evt?.data ?? evt;
      if (incomingCode !== roomCode || !payload) return;

      const curr = stateRef.current;
      const obj = curr.activeObjection;
      if (!obj || obj.resolved || obj.id !== payload.objectionId) return;

      if (Date.now() > obj.endsAt || payload.contestantId === obj.contestantId || !mergedContestants.some(c => c.id === payload.contestantId)) return;
      const votersFor = new Set(obj.votesFor);
      const votersAgainst = new Set(obj.votesAgainst);

      if (payload.voteFor) {
        votersFor.add(payload.contestantId);
        votersAgainst.delete(payload.contestantId);
      } else {
        votersAgainst.add(payload.contestantId);
        votersFor.delete(payload.contestantId);
      }

      const updatedObj: ObjectionState = {
        ...obj,
        votesFor: Array.from(votersFor),
        votesAgainst: Array.from(votersAgainst),
      };

      const updatedState: ArabicRoomState = {
        ...curr,
        activeObjection: updatedObj,
      };
      syncState(updatedState);
    });

    // 4. Inter-round Ready update
    const unsubReady = roomBus.on('PLAYER_READY_UPDATE', (evt: any) => {
      const incomingCode = evt?.roomCode;
      const payload = evt?.data ?? evt;
      if (incomingCode !== roomCode || !payload) return;

      const curr = stateRef.current;
      if (curr.phase !== 'RESULTS' || !mergedContestants.some(c => c.id === payload.playerId)) return;

      const currentReady = new Set(curr.readyPlayersNextRound || []);
      if (payload.isReady) {
        currentReady.add(payload.playerId);
      } else {
        currentReady.delete(payload.playerId);
      }

      const nextReadyList = Array.from(currentReady);
      const updatedState: ArabicRoomState = {
        ...curr,
        readyPlayersNextRound: nextReadyList,
      };

      syncState(updatedState);
    });

    return () => {
      unsubAnswers1?.();
      unsubAnswers2?.();
      unsubObjection1?.();
      unsubObjection2?.();
      unsubVote?.();
      unsubReady?.();
    };
  }, [roomCode, mergedContestants.length, syncState, executeJudging, handleNextRound]);

  useEffect(() => {
    if (arabicState.phase !== 'RESULTS' || (arabicState.activeObjection && !arabicState.activeObjection.resolved)) return;
    if (mergedContestants.length && mergedContestants.every(c => arabicState.readyPlayersNextRound.includes(c.id))) handleNextRound();
  }, [arabicState.phase, arabicState.activeObjection, arabicState.readyPlayersNextRound, mergedContestants, handleNextRound]);

  // -------------------------------------------------------------
  // Objection Timer & Resolution Check (10-second live voting)
  // -------------------------------------------------------------
  useEffect(() => {
    const obj = arabicState.activeObjection;
    if (!obj || obj.resolved || arabicState.phase !== 'RESULTS') return;

    const interval = setInterval(() => {
      const curr = stateRef.current;
      const currentObj = curr.activeObjection;
      if (!currentObj || currentObj.resolved) return;

      const remainingMs = currentObj.endsAt - Date.now();
      const otherContestants = mergedContestants.filter((p) => p.id !== currentObj.contestantId);
      const otherContestantsCount = Math.max(1, otherContestants.length);
      const totalVotes = currentObj.votesFor.length + currentObj.votesAgainst.length;

      // Resolve when 10 seconds is up or all other contestants have voted
      if (remainingMs <= 0 || totalVotes >= otherContestantsCount) {
        clearInterval(interval);

        const isOverturned = currentObj.votesFor.length > currentObj.votesAgainst.length;

        const updatedEvals = Object.fromEntries(Object.entries(curr.evaluations).map(([id, ev]) => [id, { ...ev, answers: ev.answers.map(a => ({ ...a })) }]));
        const answer = updatedEvals[currentObj.contestantId]?.answers[currentObj.categoryIndex];
        if (answer && isOverturned) {
          answer.isValid = true;
          answer.needsReview = false;
          answer.objectionOverturned = true;
          answer.comment = 'قبلتها المجموعة';
        }
        if (answer && !isOverturned) {
          answer.needsReview = false;
          answer.comment = 'لم تقبلها المجموعة';
        }
        const rescored = recalculateArabicRound(curr, updatedEvals);
        const earnedPoints = isOverturned ? rescored.evaluations[currentObj.contestantId]?.answers[currentObj.categoryIndex]?.points || 0 : 0;
        const resolvedState: ArabicRoomState = {
          ...curr,
          activeObjection: {
            ...currentObj,
            resolved: true,
          },
          ...rescored,
        };

        stateRef.current = resolvedState;
        syncState(resolvedState);

        // Broadcast ARABIC_OBJECTION_RESOLVED to all screens
        roomBus.broadcastArabicObjectionResolved(roomCode, {
          objectionId: currentObj.id,
          contestantId: currentObj.contestantId,
          contestantName: currentObj.contestantName,
          categoryIndex: currentObj.categoryIndex,
          categoryName: currentObj.categoryName,
          answer: currentObj.answer,
          isOverturned,
          earnedPoints,
          votesFor: currentObj.votesFor.length,
          votesAgainst: currentObj.votesAgainst.length,
        });
      }
    }, 250);

    return () => clearInterval(interval);
  }, [arabicState.activeObjection, arabicState.phase, mergedContestants, roomCode, syncState]);

  // -------------------------------------------------------------
  // View Rendering
  // -------------------------------------------------------------

  // 1. Lobby View
  useEffect(() => roomBus.on('GAME_STARTED', () => {
    if (stateRef.current.phase === 'LOBBY') void startRoundRoulette();
  }, roomCode), [roomCode, startRoundRoulette]);

  useEffect(() => {
    if (!mobileContestants || arabicState.phase !== 'ROULETTE') return;
    const timer = setTimeout(() => { void startRoundInput(); }, 4200);
    return () => clearTimeout(timer);
  }, [mobileContestants, arabicState.phase, startRoundInput]);

  useEffect(() => roomBus.on('RETURN_TO_LOBBY', () => {
    ++analysisGeneration.current;
    const fresh = createInitialArabicState(roomCode, true);
    syncState(fresh);
  }, roomCode), [roomCode, syncState]);

  useEffect(()=>{if(arabicState.roundTransition)syncState({...stateRef.current,roundTransition:undefined});},[arabicState.roundTransition,syncState]);
  useEffect(()=>{onNextRoundReady?.(handleNextRound);return()=>onNextRoundReady?.(()=>{});},[onNextRoundReady,handleNextRound]);
  if (mobileContestants) return null;

  if (arabicState.phase === 'LOBBY') {
    return (
      <UnifiedShabahLobby
        roomCode={roomCode}
        gameId="ai-arabic"
        gameTitle="الشبح العربي"
        role="host"
      />
    );
  }

  // 2. Letter Roulette Stage
  if (arabicState.phase === 'ROULETTE') {
    return (
      <ArabicRouletteStage
        targetLetter={arabicState.currentLetter}
        roundNumber={arabicState.roundNumber}
        totalRounds={arabicState.totalRounds}
        isTV={true}
        onComplete={startRoundInput}
        onSkip={startRoundInput}
      />
    );
  }

  // 3. Judging Phase (Dedicated Waiting Screen)
  if (arabicState.phase === 'JUDGING') {
    return <ShabahThinkingScreen title="الشبح العربي يدقّق الكلمات" />;
  }

  // 4. Solving Stage (TV View)
  if (arabicState.phase === 'INPUT') {
    const submittedCount = Object.keys(arabicState.submissions || {}).length;
    const totalCount = Math.max(1, mergedContestants.length);

    return (
      <div
        dir="rtl"
        className="w-full h-screen max-h-screen bg-black text-white p-6 flex flex-col items-center justify-between select-none"
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#B56BFF] via-[#38BDF8] to-[#4ADE80] p-0.5 shadow-[0_0_20px_rgba(56,189,248,0.3)]">
              <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center">
                <span className="font-sans font-black text-2xl text-emerald-400">
                  {arabicState.currentLetter}
                </span>
              </div>
            </div>
            <div>
              <div className="text-xl font-sans font-black text-white">
                الجولة {arabicState.roundNumber} من {arabicState.totalRounds}
              </div>
              <div className="text-xs font-sans text-zinc-400">
                اكتبوا في جوالاتكم إجابات تبدأ بحرف ({arabicState.currentLetter})
              </div>
            </div>
          </div>

          {/* Countdown Clock & Navigation Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-amber-400 font-sans font-extrabold text-2xl shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Clock className="w-6 h-6 animate-pulse" />
              <span>{arabicState.timerSeconds} ثانية</span>
            </div>

            <button
              onClick={handleReturnToLobby}
              className="px-3.5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white font-sans font-bold text-xs transition-colors cursor-pointer"
            >
              العودة للوبي
            </button>

            <button
              onClick={handleEndGame}
              className="px-3.5 py-2.5 rounded-2xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 hover:text-red-200 font-sans font-bold text-xs transition-colors cursor-pointer"
            >
              إنهاء اللعبة
            </button>
          </div>
        </div>

        {/* Center: The 5 Categories Display */}
        <div className="w-full max-w-4xl my-auto">
          <div className="text-center font-sans font-black text-zinc-400 text-sm mb-4">
            فئات الجولة الحالية:
          </div>
          <div className="grid grid-cols-5 gap-3">
            {arabicState.currentCategories.map((cat, idx) => (
              <div
                key={idx}
                className="bg-zinc-950 border-2 border-zinc-800 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-lg hover:border-zinc-700 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center font-sans font-black text-xs text-zinc-400 mb-2">
                  {idx + 1}
                </div>
                <div className="font-sans font-black text-lg text-white">
                  {cat}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Submission Progress Bar & Early Advance */}
        <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <div className="font-sans text-sm text-zinc-300">
            تم تسليم إجابات:{' '}
            <strong className="text-emerald-400 font-black">
              {submittedCount} من {totalCount}
            </strong>
          </div>

          <button
            onClick={executeJudging}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-sans font-bold text-xs border border-zinc-700 transition-colors cursor-pointer"
          >
            إنهاء وتصحيح فوراً
          </button>
        </div>
      </div>
    );
  }

  // 5. Results & Objection Phase
  if (arabicState.phase === 'RESULTS') {
    return (
      <ArabicTVResults
        state={arabicState}
        onNextRound={handleNextRound}
        readyContestants={arabicState.readyPlayersNextRound || []}
        totalConnectedContestants={Math.max(1, mergedContestants.length)}
        onReturnToLobby={handleReturnToLobby}
      />
    );
  }

  // 5. Final Podium Phase
  const ranked = getRankedContestants(arabicState.cumulativeScores, mergedContestants);
  return (
    <ArabicFinalPodium
      rankedContestants={ranked}
      isTV={true}
      onExtendRounds={handleExtendRounds}
      onReturnToLobby={handleReturnToLobby}
    />
  );
};

export default ArabicTVRoot;
