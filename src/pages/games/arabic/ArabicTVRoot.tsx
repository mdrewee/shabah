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
  normalizeArabicWord,
} from '../../../services/arabicEngine';
import { ArabicRouletteStage } from './components/ArabicRouletteStage';
import { ArabicTVResults } from './components/ArabicTVResults';
import { ArabicFinalPodium } from './components/ArabicFinalPodium';
import { Clock } from 'lucide-react';

export const ArabicTVRoot: React.FC = () => {
  const { code: rawCode } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const roomCode = (rawCode || 'SHBH').trim().toUpperCase();

  const { room } = useRoom(roomCode);
  const activeRoom = room || roomBus.getRoom(roomCode);

  // Realtime presence connection for Host TV
  const { connectedPlayers: realtimeContestants } = useRoomSync({
    roomCode,
    role: 'host',
  });

  const [arabicState, setArabicState] = useState<ArabicRoomState>(() =>
    createInitialArabicState(roomCode)
  );

  const stateRef = useRef(arabicState);
  useEffect(() => {
    stateRef.current = arabicState;
    savePersistedArabicState(roomCode, arabicState);
  }, [arabicState, roomCode]);

  // Merged connected contestants
  const mergedContestants =
    realtimeContestants.length > 0
      ? realtimeContestants
      : (activeRoom?.players || []).filter((p) => p.id !== 'host_tv');

  // Synchronize state to mobile contestants
  const syncState = useCallback(
    (newState: ArabicRoomState) => {
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

  const executeJudging = useCallback(async (overrideSubmissions?: Record<string, any>) => {
    const curr = stateRef.current;
    if (curr.phase === 'JUDGING' || curr.phase === 'RESULTS') return;

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
    stateRef.current = resultsState;
    syncState(resultsState);

    // Broadcast definitive ARABIC_RESULTS_READY with full batch array to mobile contestants
    roomBus.broadcastArabicResultsReady(roomCode, {
      evaluations: playerEvals,
      roundNumber: curr.roundNumber,
    });

    sound.playVictory();
  }, [mergedContestants, roomCode, syncState]);

  const handleNextRound = useCallback(() => {
    const curr = stateRef.current;
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
    try {
      await roomBus.terminateRoom(roomCode, 'تم إنهاء الغرفة بواسطة المضيف');
    } catch (err) {
      console.warn('[ArabicTVRoot] terminateRoom error:', err);
    }
    sessionStorage.clear();
    localStorage.removeItem('current_room_code');
    window.location.href = '/';
  }, [roomCode]);

  const handleReturnToLobby = useCallback(() => {
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

    const interval = setInterval(() => {
      setArabicState((prev) => {
        if (prev.phase !== 'INPUT') return prev;
        const nextSec = prev.timerSeconds - 1;

        if (nextSec <= 0) {
          clearInterval(interval);
          roomBus.broadcastArabicTimeUp(roomCode);
          setTimeout(() => {
            executeJudging();
          }, 800);
          return { ...prev, timerSeconds: 0 };
        }

        if (nextSec <= 5) {
          sound.playTick();
        }

        const updated = { ...prev, timerSeconds: nextSec };
        roomBus.broadcastArabicSync(roomCode, updated);
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [arabicState.phase, executeJudging, roomCode]);

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
      const contestantName = String(payload.contestantName || payload.playerName || 'متسابق');
      if (!contestantId) return;

      const updatedSubmissions = {
        ...curr.submissions,
        [contestantId]: {
          contestantId,
          contestantName,
          answers: payload.answers || {},
          finishedAt: payload.finishedAt || Date.now(),
          submissionDurationMs: payload.durationMs || 60000,
        },
      };

      const updatedState = {
        ...curr,
        submissions: updatedSubmissions,
      };

      stateRef.current = updatedState;

      // Check early advance: if all connected contestants submitted
      const connectedCount = Math.max(1, mergedContestants.length);
      const submittedCount = Object.keys(updatedSubmissions).length;

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

      sound.playNotification?.();

      const catIdx =
        typeof payload.categoryIndex === 'number'
          ? payload.categoryIndex
          : payload.category
          ? curr.currentCategories.indexOf(payload.category)
          : 0;

      const objection: ObjectionState = {
        id: `obj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        contestantId: payload.contestantId,
        contestantName: payload.contestantName,
        categoryIndex: catIdx >= 0 ? catIdx : 0,
        categoryName: payload.category || curr.currentCategories[catIdx] || '',
        answer: payload.answer,
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
      if (curr.phase !== 'RESULTS') return;

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

      // Auto-advance if >= 2 ready or all connected ready
      const minRequired = Math.min(2, Math.max(1, mergedContestants.length));
      if (nextReadyList.length >= minRequired) {
        handleNextRound();
      } else {
        syncState(updatedState);
      }
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

        const updatedEvals = { ...curr.evaluations };
        const updatedPlayerEvals = curr.playerEvaluations ? [...curr.playerEvaluations] : [];
        const updatedCumulative = { ...curr.cumulativeScores };

        let earnedPoints = 0;

        if (isOverturned) {
          sound.playVictory();

          // Check if any other contestant had this exact answer correctly in this category (for duplicate detection)
          const normAns = normalizeArabicWord(currentObj.answer);
          let isDuplicate = false;

          Object.values(updatedEvals).forEach((ev) => {
            if (ev.contestantId !== currentObj.contestantId) {
              const matchedAns = ev.answers.find(
                (a) => a.categoryIndex === currentObj.categoryIndex && a.isValid
              );
              if (matchedAns && normalizeArabicWord(matchedAns.rawAnswer) === normAns) {
                isDuplicate = true;
              }
            }
          });

          earnedPoints = isDuplicate ? 5 : 10;

          // 1. Update legacy evaluation format
          if (updatedEvals[currentObj.contestantId]) {
            const targetAns = updatedEvals[currentObj.contestantId].answers[currentObj.categoryIndex];
            if (targetAns) {
              targetAns.isValid = true;
              targetAns.objectionOverturned = true;
              targetAns.points = earnedPoints;
              targetAns.isUnique = !isDuplicate;
              targetAns.comment =
                earnedPoints === 10
                  ? 'تم قبول الاعتراض بتصويت الأغلبية (+١٠)'
                  : 'تم قبول الاعتراض بتصويت الأغلبية (مكرر +٥)';

              const newRoundPoints = updatedEvals[currentObj.contestantId].answers.reduce(
                (sum, a) => sum + (a.points || 0),
                0
              );
              updatedEvals[currentObj.contestantId].roundPoints = newRoundPoints;
              updatedEvals[currentObj.contestantId].totalRoundPoints =
                newRoundPoints + (updatedEvals[currentObj.contestantId].speedBonus || 0);
            }
          }

          // 2. Update playerEvaluations array
          const pIdx = updatedPlayerEvals.findIndex((pe) => pe.playerId === currentObj.contestantId);
          if (pIdx !== -1) {
            const pe = { ...updatedPlayerEvals[pIdx] };
            const catRes =
              pe.results[currentObj.categoryIndex] ||
              pe.results.find((r) => r.category === currentObj.categoryName);
            if (catRes) {
              catRes.isCorrect = true;
              catRes.score = earnedPoints;
              catRes.reason =
                earnedPoints === 10 ? 'تم قبول الاعتراض (+١٠)' : 'تم قبول الاعتراض (مكرر +٥)';
            }
            pe.totalScore = pe.results.reduce((sum, r) => sum + (r.score || 0), 0);
            updatedPlayerEvals[pIdx] = pe;
          }

          // 3. Update cumulative score
          updatedCumulative[currentObj.contestantId] =
            (updatedCumulative[currentObj.contestantId] || 0) + earnedPoints;
        } else {
          sound.playIncorrect?.();
        }

        const resolvedState: ArabicRoomState = {
          ...curr,
          activeObjection: {
            ...currentObj,
            resolved: true,
          },
          evaluations: updatedEvals,
          playerEvaluations:
            updatedPlayerEvals.length > 0 ? updatedPlayerEvals : curr.playerEvaluations,
          cumulativeScores: updatedCumulative,
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
  if (arabicState.phase === 'LOBBY') {
    return (
      <UnifiedShabahLobby
        roomCode={roomCode}
        gameId="ai-arabic"
        gameTitle="الشبح العربي"
        role="host"
        onStartGame={startRoundRoulette}
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
    return (
      <div dir="rtl" className="w-full h-screen max-h-screen bg-black text-white flex flex-col justify-between p-6 select-none">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-sans text-xs">الغرفة:</span>
            <span className="font-sans font-bold text-white tracking-widest">{roomCode}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReturnToLobby}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white font-sans font-bold text-xs transition-colors cursor-pointer"
            >
              العودة للوبي
            </button>
            <button
              onClick={handleEndGame}
              className="px-3.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 hover:text-red-200 font-sans font-bold text-xs transition-colors cursor-pointer"
            >
              إنهاء اللعبة
            </button>
          </div>
        </div>

        {/* Center Ghost Waiting Stage */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="relative mb-6">
            <div className="p-1 rounded-full bg-gradient-to-tr from-[#B56BFF] via-[#38BDF8] to-[#4ADE80] shadow-[0_0_50px_rgba(56,189,248,0.4)] animate-pulse">
              <div className="w-36 h-36 rounded-full bg-[#0A0A0A] flex items-center justify-center">
                <span className="font-sans font-black text-6xl text-emerald-400">
                  {arabicState.currentLetter}
                </span>
              </div>
            </div>
          </div>

          <h2 className="font-sans font-bold text-3xl text-white tracking-tight mb-3">
            الشبح العربي يدقق القواميس والمعاجم...
          </h2>
          <p className="font-sans text-sm text-zinc-400 max-w-md leading-relaxed mb-6">
            مطابقة إجابات المتسابقين في المعاجم العربية وتطبيق قواعد النقاط والمكررات.
          </p>

          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-sans">
            <Clock className="w-4 h-4 text-emerald-400 animate-spin" />
            <span>تصحيح الإجابات ورصد بونص السرعة قيد التنفيذ...</span>
          </div>
        </div>
      </div>
    );
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
