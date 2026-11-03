import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom, roomBus } from '../../../lib/roomBus';
import { useRoomSync } from '../../../hooks/useRoomSync';
import { sound } from '../../../lib/audio';
import { UnifiedShabahLobby } from '../../../components/lobby/UnifiedShabahLobby';
import {
  FlyingRoomState,
  FlyingSubmission,
  FlyingContestantResult,
  RankedFlyingContestant,
  FlyingTier,
} from './types';
import {
  createInitialFlyingState,
  savePersistedFlyingState,
  clearPersistedFlyingState,
  getRankedFlyingContestants,
} from './flyingSync';
import { getRandomFlyingQuestion } from './flyingQuestions';
import { evaluateFlyingAnswers } from './flyingEngine';
import {
  Rocket,
  Flame,
  Trophy,
  Crown,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle2,
  FlameKindling,
  XCircle,
  Zap,
} from 'lucide-react';

const MAX_SKY_METERS = 1500;
const ROUND_TIME = 35; // 35 seconds per question

export const FlyingTVRoot: React.FC = () => {
  const { code } = useParams<{ code?: string }>();
  const roomCode = (code || 'SHBH').trim().toUpperCase();
  const navigate = useNavigate();

  const { room } = useRoom(roomCode);
  const activeRoom = room || roomBus.getRoom(roomCode);

  const { connectedPlayers: realtimeContestants } = useRoomSync({
    roomCode,
    role: 'host',
  });

  const [flyingState, setFlyingState] = useState<FlyingRoomState>(() =>
    createInitialFlyingState(roomCode)
  );
  const stateRef = useRef<FlyingRoomState>(flyingState);
  stateRef.current = flyingState;

  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [animatingMeters, setAnimatingMeters] = useState<Record<string, number>>({});
  const [autoAdvanceSeconds, setAutoAdvanceSeconds] = useState<number>(6);
  const [tvTestAnswer, setTvTestAnswer] = useState<string>('');

  const mergedContestants =
    realtimeContestants.length > 0
      ? realtimeContestants
      : (activeRoom?.players || []).filter((p) => p.id !== 'host_tv');

  // Broadcast state changes to all players & save to storage
  const syncState = useCallback(
    (newState: FlyingRoomState) => {
      setFlyingState(newState);
      savePersistedFlyingState(roomCode, newState);
      roomBus.safeBroadcast(roomCode, 'FLYING_STATE_SYNC', newState);
    },
    [roomCode]
  );

  // -------------------------------------------------------------
  // Round Flow Handlers
  // -------------------------------------------------------------
  const startQuestionRound = useCallback(
    (roundNum: number, usedIds: string[]) => {
      sound.playClick();
      const question = getRandomFlyingQuestion(usedIds);
      const nextUsed = [...usedIds, question.id];

      const nextState: FlyingRoomState = {
        ...stateRef.current,
        phase: 'QUESTION',
        roundNumber: roundNum,
        currentQuestion: question,
        usedQuestionIds: nextUsed,
        timerSeconds: ROUND_TIME,
        roundStartedAt: Date.now(),
        submissions: {},
        results: {},
        activeSpotlightIndex: 0,
        cameraMode: 'spotlight',
        readyPlayersNextRound: [],
      };

      syncState(nextState);
    },
    [syncState]
  );

  const handleStartGame = useCallback(() => {
    sound.playVictory();
    startQuestionRound(1, []);
  }, [startQuestionRound]);

  const handleReturnToLobby = useCallback(() => {
    sound.playClick();
    clearPersistedFlyingState(roomCode);
    const lobbyState: FlyingRoomState = {
      ...createInitialFlyingState(roomCode),
      phase: 'LOBBY',
      cumulativeMeters: {},
      submissions: {},
      results: {},
    };
    syncState(lobbyState);
    roomBus.broadcastReturnToLobby(roomCode);
  }, [roomCode, syncState]);

  // Execute AI Evaluation
  const executeEvaluation = useCallback(
    async (overrideSubmissions?: Record<string, FlyingSubmission>) => {
      const curr = stateRef.current;
      if (curr.phase === 'CALCULATING' || curr.phase === 'REVEALING') return;

      sound.playTick();
      const subs = overrideSubmissions || curr.submissions || {};
      const calcState: FlyingRoomState = {
        ...curr,
        phase: 'CALCULATING',
        submissions: subs,
      };
      stateRef.current = calcState;
      syncState(calcState);

      // Prepare submissions list from connected contestants
      const submissionsList: FlyingSubmission[] = [];
      const processedIds = new Set<string>();

      mergedContestants.forEach((c) => {
        processedIds.add(c.id);
        const sub = subs[c.id];
        submissionsList.push({
          contestantId: c.id,
          contestantName: c.name,
          answer: sub?.answer || '',
          submittedAt: sub?.submittedAt || Date.now(),
        });
      });

      // Safety net for any submission received from contestant not yet in mergedContestants
      Object.values(subs).forEach((s) => {
        if (!processedIds.has(s.contestantId)) {
          processedIds.add(s.contestantId);
          submissionsList.push(s);
        }
      });

      // If solo testing on TV with 0 mobile contestants and no submissions yet
      if (submissionsList.length === 0) {
        submissionsList.push({
          contestantId: 'solo_host',
          contestantName: 'المضيف',
          answer: '',
          submittedAt: Date.now(),
        });
      }

      const evaluatedResults = await evaluateFlyingAnswers(
        curr.currentQuestion,
        submissionsList,
        curr.cumulativeMeters
      );

      // Update cumulative scores & results map
      const nextCumulative = { ...(curr.cumulativeMeters || {}) };
      const resultMap: Record<string, FlyingContestantResult> = {};

      evaluatedResults.forEach((res) => {
        resultMap[res.contestantId] = res;
        nextCumulative[res.contestantId] = res.newTotalMeters;
      });

      const revealingState: FlyingRoomState = {
        ...curr,
        phase: 'REVEALING',
        submissions: subs,
        results: resultMap,
        cumulativeMeters: nextCumulative,
        activeSpotlightIndex: 0,
        cameraMode: 'spotlight',
      };

      stateRef.current = revealingState;
      syncState(revealingState);
      roomBus.safeBroadcast(roomCode, 'FLYING_RESULTS_READY', {
        results: resultMap,
        roundNumber: curr.roundNumber,
      });
    },
    [mergedContestants, roomCode, syncState]
  );

  // -------------------------------------------------------------
  // Question Timer Countdown
  // -------------------------------------------------------------
  useEffect(() => {
    if (flyingState.phase !== 'QUESTION') return;

    const timer = setInterval(() => {
      setFlyingState((prev) => {
        if (prev.phase !== 'QUESTION') return prev;
        if (prev.timerSeconds <= 1) {
          clearInterval(timer);
          executeEvaluation();
          return { ...prev, timerSeconds: 0 };
        }
        return { ...prev, timerSeconds: prev.timerSeconds - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [flyingState.phase, executeEvaluation]);

  // -------------------------------------------------------------
  // Sequenced Spotlight Camera Progression
  // -------------------------------------------------------------
  useEffect(() => {
    if (flyingState.phase !== 'REVEALING') return;

    const activeIndex = flyingState.activeSpotlightIndex;
    const contestantsList = mergedContestants.length > 0 ? mergedContestants : Object.keys(flyingState.results).map((id) => ({ id, name: flyingState.results[id]?.contestantName || 'متسابق' }));
    const totalContestants = contestantsList.length;

    if (flyingState.cameraMode === 'spotlight') {
      const activeContestant = contestantsList[activeIndex];
      const res = activeContestant ? flyingState.results[activeContestant.id] : null;

      if (res && res.roundMeters > 0) {
        sound.playSuccess();
        // Animate counter upwards
        let start = 0;
        const target = res.roundMeters;
        const step = Math.max(1, Math.floor(target / 25));
        const countInterval = setInterval(() => {
          start = Math.min(target, start + step);
          setAnimatingMeters((prev) => ({ ...prev, [res.contestantId]: start }));
          if (start >= target) clearInterval(countInterval);
        }, 50);
      } else {
        sound.playBuzz?.();
      }

      const advanceTimer = setTimeout(() => {
        if (activeIndex + 1 < totalContestants) {
          // Advance to next contestant spotlight
          syncState({
            ...stateRef.current,
            activeSpotlightIndex: activeIndex + 1,
            cameraMode: 'spotlight',
          });
        } else {
          // All contestants revealed: transition to Global Overview
          sound.playVictory();
          syncState({
            ...stateRef.current,
            cameraMode: 'global_overview',
          });
          setAutoAdvanceSeconds(6);
        }
      }, 3800);

      return () => clearTimeout(advanceTimer);
    } else if (flyingState.cameraMode === 'global_overview') {
      // Countdown in Global Overview
      const overviewTimer = setInterval(() => {
        setAutoAdvanceSeconds((sec) => {
          if (sec <= 1) {
            clearInterval(overviewTimer);
            if (flyingState.roundNumber >= flyingState.totalRounds) {
              // Finish game and show Podium
              syncState({
                ...stateRef.current,
                phase: 'PODIUM',
              });
              sound.playVictory();
            } else {
              // Advance to next round question
              startQuestionRound(flyingState.roundNumber + 1, flyingState.usedQuestionIds);
            }
            return 0;
          }
          return sec - 1;
        });
      }, 1000);

      return () => clearInterval(overviewTimer);
    }
  }, [
    flyingState.phase,
    flyingState.activeSpotlightIndex,
    flyingState.cameraMode,
    flyingState.roundNumber,
    flyingState.totalRounds,
    flyingState.usedQuestionIds,
    mergedContestants,
    startQuestionRound,
    syncState,
  ]);

  // -------------------------------------------------------------
  // Realtime Socket Event Listeners
  // -------------------------------------------------------------
  useEffect(() => {
    // Listen for contestant answer submission
    const unsubAnswer = roomBus.on('FLYING_SUBMIT_ANSWER', (evt: any) => {
      const incomingCode = evt?.roomCode;
      const payload = evt?.data ?? evt;
      if (incomingCode && incomingCode !== roomCode) return;
      if (!payload || !payload.contestantId) return;

      const curr = stateRef.current;
      if (curr.phase !== 'QUESTION') return;

      sound.playClick();
      const newSub: FlyingSubmission = {
        contestantId: payload.contestantId,
        contestantName: payload.contestantName || 'متسابق',
        answer: (payload.answer || '').trim(),
        submittedAt: Date.now(),
      };

      const updatedSubmissions = {
        ...curr.submissions,
        [payload.contestantId]: newSub,
      };

      const updatedState: FlyingRoomState = {
        ...curr,
        submissions: updatedSubmissions,
      };

      stateRef.current = updatedState;
      setFlyingState(updatedState);
      savePersistedFlyingState(roomCode, updatedState);

      // Auto-trigger calculation if all connected contestants submitted
      const connectedCount = Math.max(1, mergedContestants.length);
      const submittedCount = Object.keys(updatedSubmissions).length;
      if (submittedCount >= connectedCount) {
        executeEvaluation(updatedSubmissions);
      } else {
        syncState(updatedState);
      }
    });

    const unsubGameStarted = roomBus.on('GAME_STARTED', (evt: any) => {
      const incomingCode = evt?.roomCode;
      if (incomingCode && incomingCode !== roomCode) return;
      if (stateRef.current.phase === 'LOBBY') {
        handleStartGame();
      }
    });

    const unsubNextRound = roomBus.on('FLYING_NEXT_ROUND', (evt: any) => {
      const incomingCode = evt?.roomCode;
      if (incomingCode && incomingCode !== roomCode) return;
      const curr = stateRef.current;
      if (curr.roundNumber < curr.totalRounds) {
        startQuestionRound(curr.roundNumber + 1, curr.usedQuestionIds);
      } else {
        syncState({ ...curr, phase: 'PODIUM' });
      }
    });

    const unsubReturn = roomBus.on('RETURN_TO_LOBBY', (evt: any) => {
      const incomingCode = evt?.roomCode;
      if (incomingCode && incomingCode !== roomCode) return;
      handleReturnToLobby();
    });

    return () => {
      unsubAnswer?.();
      unsubGameStarted?.();
      unsubNextRound?.();
      unsubReturn?.();
    };
  }, [roomCode, mergedContestants.length, executeEvaluation, handleStartGame, handleReturnToLobby, startQuestionRound, syncState]);

  // -------------------------------------------------------------
  // 1. Lobby Phase
  // -------------------------------------------------------------
  if (flyingState.phase === 'LOBBY') {
    return (
      <UnifiedShabahLobby
        roomCode={roomCode}
        gameId="ai-flying"
        gameTitle="الشبح الطائر"
        role="host"
        onStartGame={handleStartGame}
        onExit={() => navigate('/')}
      />
    );
  }

  // -------------------------------------------------------------
  // 2. Podium Phase
  // -------------------------------------------------------------
  if (flyingState.phase === 'PODIUM') {
    const ranked = getRankedFlyingContestants(
      flyingState.cumulativeMeters,
      mergedContestants,
      flyingState.results
    );
    const first = ranked[0];
    const second = ranked[1];
    const third = ranked[2];

    return (
      <div
        dir="rtl"
        className="min-h-screen w-full bg-[#050508] text-white flex flex-col items-center justify-between p-6 sm:p-10 select-none overflow-hidden relative"
      >
        {/* Background cosmic glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-purple-950/20 to-black pointer-events-none" />

        {/* Top Header */}
        <header className="relative z-10 flex flex-col items-center text-center gap-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-sm font-bold tracking-widest uppercase">
            <Trophy className="w-4 h-4 text-amber-400" />
            التتويج النهائي لأبطال الفضاء
          </div>
          <h1 className="font-sans font-black text-4xl sm:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 drop-shadow-md">
            سادة سماء شبح
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base font-medium">
            بعد ٥ جولات نارية من التنافس والتحليق بالأجوبة النادرة!
          </p>
        </header>

        {/* 3-Tier Podium */}
        <div className="relative z-10 w-full max-w-4xl flex items-end justify-center gap-4 sm:gap-6 my-auto pt-12 pb-6">
          {/* Second Place (Left) */}
          {second && (
            <div className="flex-1 flex flex-col items-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-zinc-900 border-2 border-zinc-700 flex flex-col items-center justify-center p-2 mb-3 shadow-[0_0_20px_rgba(161,161,170,0.2)]">
                <span className="text-3xl sm:text-4xl">🛸</span>
              </div>
              <span className="font-sans font-black text-base sm:text-xl text-zinc-200 truncate max-w-[140px]">
                {second.name}
              </span>
              <span className="font-mono text-sm sm:text-base font-black text-cyan-400">
                {second.totalMeters} م
              </span>
              <div className="w-full h-36 sm:h-44 rounded-t-2xl bg-gradient-to-t from-zinc-800 to-zinc-700/80 border-t-4 border-zinc-400 flex items-center justify-center text-zinc-300 font-black text-3xl shadow-xl mt-3">
                2
              </div>
            </div>
          )}

          {/* First Place (Center - Highest) */}
          {first && (
            <div className="flex-1 flex flex-col items-center z-20">
              <div className="relative">
                <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 absolute -top-9 left-1/2 -translate-x-1/2 animate-bounce drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-b from-amber-500/20 to-zinc-900 border-2 border-amber-400 flex flex-col items-center justify-center p-2 mb-3 shadow-[0_0_35px_rgba(251,191,36,0.4)]">
                  <span className="text-4xl sm:text-5xl">👑</span>
                </div>
              </div>
              <span className="font-sans font-black text-xl sm:text-2xl text-amber-300 truncate max-w-[170px]">
                {first.name}
              </span>
              <span className="font-mono text-base sm:text-xl font-black text-amber-400">
                {first.totalMeters} م 🚀
              </span>
              <div className="w-full h-48 sm:h-60 rounded-t-2xl bg-gradient-to-t from-amber-600/40 via-amber-500/30 to-amber-400 border-t-4 border-amber-300 flex items-center justify-center text-amber-950 font-black text-4xl shadow-2xl mt-3">
                1
              </div>
            </div>
          )}

          {/* Third Place (Right) */}
          {third && (
            <div className="flex-1 flex flex-col items-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-zinc-900 border-2 border-amber-800/60 flex flex-col items-center justify-center p-2 mb-3 shadow-[0_0_20px_rgba(180,83,9,0.2)]">
                <span className="text-3xl sm:text-4xl">🚀</span>
              </div>
              <span className="font-sans font-black text-base sm:text-xl text-amber-600/90 truncate max-w-[140px]">
                {third.name}
              </span>
              <span className="font-mono text-sm sm:text-base font-black text-cyan-400">
                {third.totalMeters} م
              </span>
              <div className="w-full h-28 sm:h-36 rounded-t-2xl bg-gradient-to-t from-zinc-900 to-amber-900/40 border-t-4 border-amber-700 flex items-center justify-center text-amber-600/80 font-black text-3xl shadow-xl mt-3">
                3
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <footer className="relative z-10 flex items-center justify-center gap-4 w-full max-w-md">
          <button
            type="button"
            onClick={handleStartGame}
            className="flex-1 py-4 px-6 rounded-2xl font-black text-lg text-black bg-gradient-to-r from-amber-300 to-yellow-400 hover:from-amber-200 hover:to-yellow-300 shadow-[0_0_20px_rgba(251,191,36,0.3)] active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>لعبة جديدة</span>
          </button>
          <button
            type="button"
            onClick={handleReturnToLobby}
            className="py-4 px-6 rounded-2xl font-black text-base text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowRight className="w-5 h-5" />
            <span>العودة للوبي</span>
          </button>
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. Question & Calculating Phase
  // -------------------------------------------------------------
  const q = flyingState.currentQuestion;
  const contestantsList =
    mergedContestants.length > 0
      ? mergedContestants
      : Object.keys(flyingState.submissions).map((id) => ({
          id,
          name: flyingState.submissions[id]?.contestantName || 'متسابق',
        }));

  const submittedCount = Object.keys(flyingState.submissions).length;
  const totalContestants = Math.max(1, contestantsList.length);

  if (flyingState.phase === 'QUESTION' || flyingState.phase === 'CALCULATING') {
    return (
      <div
        dir="rtl"
        className="min-h-screen w-full bg-[#030305] text-white flex flex-col justify-between p-6 sm:p-10 select-none relative overflow-hidden"
      >
        {/* Sky Aurora Ambient Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-950/40 via-neutral-950 to-black pointer-events-none" />

        {/* Top Header Bar */}
        <header className="relative z-10 w-full max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Rocket className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="font-mono text-xs font-bold text-indigo-400 tracking-wider">
                الجولة {flyingState.roundNumber} من {flyingState.totalRounds}
              </span>
              <h2 className="font-sans font-black text-xl text-white">الشبح الطائر</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer Badge */}
            <div
              className={`flex items-center gap-2 px-5 py-2 rounded-2xl border font-mono font-black text-2xl ${
                flyingState.timerSeconds <= 5
                  ? 'bg-red-500/20 border-red-500 text-red-400 animate-bounce'
                  : 'bg-zinc-900/80 border-zinc-700 text-cyan-400'
              }`}
            >
              <span>{flyingState.timerSeconds} ث</span>
            </div>

            {/* Mute Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !isMuted;
                sound.setMuted(next);
                setIsMuted(next);
              }}
              className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Question Display Card */}
        <main className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center text-center my-auto">
          {flyingState.phase === 'QUESTION' ? (
            <div className="w-full bg-zinc-950/80 border-2 border-zinc-800/80 rounded-3xl p-8 sm:p-12 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-md flex flex-col items-center">
              <span className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-sans font-black text-xs sm:text-sm mb-4">
                تصنيف: {q.category}
              </span>

              <h1 className="font-sans font-black text-3xl sm:text-5xl text-white leading-tight mb-4 drop-shadow-md">
                {q.title}
              </h1>

              <p className="text-zinc-400 font-sans text-sm sm:text-lg flex items-center gap-2 mb-8">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                <span>{q.examplesHint}</span>
              </p>

              {/* Contestant Submissions Counter */}
              <div className="w-full max-w-md flex flex-col items-center gap-3">
                <div className="w-full flex items-center justify-between text-xs font-mono font-bold text-zinc-400 px-1">
                  <span>المتسابقون الجاهزون للإقلاع:</span>
                  <span className="text-cyan-400">
                    {submittedCount} / {totalContestants}
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-500"
                    style={{ width: `${(submittedCount / totalContestants) * 100}%` }}
                  />
                </div>

                {/* Quick input on TV if solo testing or host wants to participate */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const clean = tvTestAnswer.trim();
                    if (!clean) return;
                    const newSub: FlyingSubmission = {
                      contestantId: 'host_player',
                      contestantName: 'المضيف',
                      answer: clean,
                      submittedAt: Date.now(),
                    };
                    const updatedSubs = {
                      ...flyingState.submissions,
                      host_player: newSub,
                    };
                    setTvTestAnswer('');
                    if (mergedContestants.length === 0) {
                      executeEvaluation(updatedSubs);
                    } else {
                      syncState({ ...flyingState, submissions: updatedSubs });
                    }
                  }}
                  className="w-full flex items-center gap-2 mt-3"
                >
                  <input
                    type="text"
                    value={tvTestAnswer}
                    onChange={(e) => setTvTestAnswer(e.target.value)}
                    placeholder="إجابة سريعة من الشاشة (اختياري)..."
                    maxLength={60}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-sans font-bold text-sm focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    className="py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs cursor-pointer shrink-0"
                  >
                    أطلق 🚀
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => executeEvaluation()}
                  className="mt-2 px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white font-sans font-bold text-xs transition-colors cursor-pointer"
                >
                  إنهاء الوقت وإطلاق الأشباح فوراً 🚀
                </button>
              </div>
            </div>
          ) : (
            // CALCULATING
            <div className="w-full bg-zinc-950/80 border-2 border-indigo-500/40 rounded-3xl p-12 shadow-[0_0_50px_rgba(99,102,241,0.2)] flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full border-4 border-indigo-500/20 border-t-indigo-400 animate-spin mb-6" />
              <h2 className="font-sans font-black text-3xl sm:text-4xl text-white mb-2">
                الشبح يحسب ندرة الإجابات وأمتار الطيران...
              </h2>
              <p className="text-zinc-400 text-base">
                جاري فحص التكرارات وتحديد من سيصل إلى حافة الغلاف الجوي!
              </p>
            </div>
          )}
        </main>

        {/* Bottom Contestants Badges */}
        <footer className="relative z-10 w-full max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-2.5">
          {contestantsList.map((c) => {
            const hasSub = Boolean(flyingState.submissions[c.id]);
            return (
              <div
                key={c.id}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                  hasSub
                    ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-500'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    hasSub ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-700'
                  }`}
                />
                <span className="truncate max-w-[110px]">{c.name}</span>
                {hasSub && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
            );
          })}
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 4. Revealing Phase: Vertical Sky World & Spotlight Camera
  // -------------------------------------------------------------
  const activeSpotlightContestant = contestantsList[flyingState.activeSpotlightIndex];
  const activeSpotlightResult = activeSpotlightContestant
    ? flyingState.results[activeSpotlightContestant.id]
    : null;

  // Calculate target camera translateY for spotlight
  const activeGhostMeters = activeSpotlightResult
    ? activeSpotlightResult.newTotalMeters
    : 0;

  // Percentage in sky from 0 to MAX_SKY_METERS (1500m)
  const skyPercent = (meters: number) => {
    return Math.min(94, Math.max(6, (meters / MAX_SKY_METERS) * 90 + 6));
  };

  return (
    <div
      dir="rtl"
      className="h-screen max-h-screen w-full bg-[#020204] text-white flex flex-col justify-between overflow-hidden relative select-none"
    >
      {/* =========================================================================
          THE VERTICAL SKY WORLD CANVAS (5 ATMOSPHERIC LAYERS: 0m to 1500m)
          ========================================================================= */}
      <div
        className="absolute inset-0 transition-transform duration-1000 ease-out origin-center"
        style={{
          transform:
            flyingState.cameraMode === 'spotlight'
              ? `scale(1.35) translateY(${Math.min(18, Math.max(-18, (skyPercent(activeGhostMeters) - 50) * 0.45))}%)`
              : 'scale(1) translateY(0%)',
        }}
      >
        {/* Gradient Sky Background */}
        <div
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, #080c14 0%, #0c1829 10%, #11294d 25%, #183d6e 40%, #2b2866 60%, #1e1145 80%, #08031a 100%)',
          }}
        />

        {/* Layer 5: Deep Space (>1100m) - Stars, Planets & Nebula */}
        <div className="absolute top-0 left-0 right-0 h-[28%] pointer-events-none overflow-hidden opacity-90">
          <div className="absolute top-8 left-16 w-20 h-20 rounded-full bg-gradient-to-tr from-amber-200 to-yellow-100 shadow-[0_0_40px_rgba(254,240,138,0.6)]" />
          <div className="absolute top-20 right-28 w-12 h-12 rounded-full bg-purple-400/40 border border-purple-300/40 shadow-[0_0_30px_rgba(192,132,252,0.4)]" />
          <div className="absolute inset-0 bg-[radial-gradient(1px_1px_at_20px_30px,#fff,rgba(0,0,0,0))] bg-[length:40px_40px] opacity-70" />
        </div>

        {/* Layer 4: Aurora Borealis & Upper Atmosphere (800m - 1100m) */}
        <div className="absolute top-[26%] left-0 right-0 h-[22%] pointer-events-none overflow-hidden opacity-40">
          <div className="w-[120%] h-full bg-gradient-to-r from-emerald-500/30 via-cyan-400/20 to-purple-500/30 blur-3xl animate-pulse" />
        </div>

        {/* Layer 3: Dense Clouds & Airplane Silhouettes (450m - 800m) */}
        <div className="absolute top-[46%] left-0 right-0 h-[24%] pointer-events-none overflow-hidden opacity-30">
          <div className="absolute top-4 left-10 w-64 h-16 rounded-full bg-white/40 blur-xl" />
          <div className="absolute top-12 right-20 w-80 h-20 rounded-full bg-white/30 blur-2xl" />
        </div>

        {/* Layer 2: Towers, Skyscrapers & Low Clouds (150m - 450m) */}
        <div className="absolute top-[68%] left-0 right-0 h-[18%] pointer-events-none opacity-20">
          <div className="absolute bottom-0 left-24 w-12 h-44 bg-slate-900 border-t-2 border-slate-700" />
          <div className="absolute bottom-0 right-32 w-16 h-56 bg-slate-900 border-t-2 border-slate-700" />
        </div>

        {/* Layer 1: Ground Level & Palm Trees (0m - 150m) */}
        <div className="absolute bottom-0 left-0 right-0 h-[14%] bg-gradient-to-t from-black via-zinc-950 to-transparent pointer-events-none border-b-8 border-emerald-950/40 flex items-end justify-between px-10">
          <div className="text-zinc-600 font-mono text-xs pb-2">سطح الأرض (0م)</div>
          <div className="text-zinc-600 font-mono text-xs pb-2">سطح الأرض (0م)</div>
        </div>

        {/* Altitude Ruler Markings (Left & Right) */}
        <div className="absolute top-0 bottom-0 left-4 w-14 flex flex-col justify-between py-10 pointer-events-none text-[10px] font-mono font-bold text-zinc-500 z-10 border-r border-zinc-800/40">
          {[1500, 1300, 1100, 900, 700, 500, 300, 100, 0].map((m) => (
            <div key={m} className="flex items-center gap-1.5">
              <span>{m}م</span>
              <div className="w-2 h-[1px] bg-zinc-700" />
            </div>
          ))}
        </div>
        <div className="absolute top-0 bottom-0 right-4 w-14 flex flex-col justify-between py-10 pointer-events-none text-[10px] font-mono font-bold text-zinc-500 z-10 border-l border-zinc-800/40 items-end">
          {[1500, 1300, 1100, 900, 700, 500, 300, 100, 0].map((m) => (
            <div key={m} className="flex items-center gap-1.5">
              <div className="w-2 h-[1px] bg-zinc-700" />
              <span>{m}م</span>
            </div>
          ))}
        </div>

        {/* =========================================================================
            CONTESTANTS' FLYING GHOSTS
            ========================================================================= */}
        <div className="absolute inset-0 px-20 flex justify-around items-end pb-8 pointer-events-none z-20">
          {contestantsList.map((c, index) => {
            const isSpotlight =
              flyingState.cameraMode === 'spotlight' &&
              index === flyingState.activeSpotlightIndex;

            const res = flyingState.results[c.id];
            const prevMeters = res ? res.previousTotalMeters : 0;
            const finalMeters = res ? res.newTotalMeters : prevMeters;

            // In spotlight, smoothly animate up to finalMeters; in global overview, stay at finalMeters
            const currentAltitude =
              isSpotlight || flyingState.cameraMode === 'global_overview'
                ? finalMeters
                : prevMeters;

            const bottomPercentage = skyPercent(currentAltitude);

            return (
              <div
                key={c.id}
                className="relative flex flex-col items-center transition-all duration-[2200ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  bottom: `${bottomPercentage}%`,
                  zIndex: isSpotlight ? 40 : 20,
                  opacity: flyingState.cameraMode === 'spotlight' && !isSpotlight ? 0.4 : 1,
                  filter:
                    flyingState.cameraMode === 'spotlight' && !isSpotlight
                      ? 'grayscale(60%)'
                      : 'none',
                }}
              >
                {/* Floating Answer & Rarity Card (Visible during its spotlight focus) */}
                {isSpotlight && res && (
                  <div className="absolute -top-36 flex flex-col items-center text-center w-64 sm:w-72 animate-in fade-in zoom-in-95 duration-500">
                    <div className="bg-zinc-950/90 border-2 border-white/20 rounded-2xl p-3.5 shadow-[0_10px_35px_rgba(0,0,0,0.9)] backdrop-blur-md flex flex-col items-center gap-1 w-full">
                      {/* Rarity Tier Badge */}
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <TierBadge tier={res.tier} meters={res.roundMeters} />
                      </div>

                      {/* Submitted Answer in Bold */}
                      <span className="font-sans font-black text-lg sm:text-xl text-white truncate max-w-full drop-shadow">
                        "{res.answer || 'بدون إجابة'}"
                      </span>

                      {/* Ghost Comment */}
                      <span className="text-xs text-zinc-300 font-medium leading-tight">
                        {res.comment}
                      </span>

                      {/* Live Counter */}
                      {res.roundMeters > 0 && (
                        <span className="font-mono text-sm font-black text-emerald-400 mt-0.5">
                          +{animatingMeters[c.id] || res.roundMeters} متر
                        </span>
                      )}
                    </div>

                    {/* Pointy Caret Arrow */}
                    <div className="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-zinc-950" />
                  </div>
                )}

                {/* The Ghost Avatar & Rocket Thruster Flame */}
                <div
                  className={`relative flex flex-col items-center transition-transform duration-300 ${
                    isSpotlight ? 'scale-125' : 'scale-100'
                  }`}
                >
                  {/* Glowing Spotlight Ring */}
                  {isSpotlight && (
                    <div className="absolute -inset-3 rounded-full bg-cyan-400/20 blur-md animate-ping pointer-events-none" />
                  )}

                  {/* Ghost Icon Body */}
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl border-2 transition-all shadow-lg ${
                      isSpotlight
                        ? 'bg-zinc-900 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)]'
                        : 'bg-zinc-900/90 border-zinc-700'
                    }`}
                  >
                    {res?.tier === 'legendary'
                      ? '👑'
                      : res?.tier === 'failed' || res?.tier === 'duplicated'
                      ? '💥'
                      : '🛸'}
                  </div>

                  {/* Rocket Booster Flame Under Ghost */}
                  {isSpotlight && res && res.roundMeters > 0 && (
                    <div className="flex flex-col items-center animate-bounce -mt-1">
                      <Flame className="w-6 h-6 text-amber-500 fill-amber-500 animate-pulse drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]" />
                      <div className="w-2 h-4 rounded-full bg-gradient-to-b from-amber-400 to-transparent blur-xs" />
                    </div>
                  )}

                  {/* Failure Stumble Smoke */}
                  {isSpotlight && res && res.roundMeters === 0 && (
                    <div className="flex items-center gap-1 mt-1 text-zinc-500 animate-pulse text-[10px] font-mono">
                      <span>💨 تعثر</span>
                    </div>
                  )}

                  {/* Contestant Name & Current Total Meters Badge */}
                  <div className="mt-1 flex flex-col items-center text-center">
                    <span className="font-sans font-black text-xs text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] truncate max-w-[90px]">
                      {c.name}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-cyan-300 bg-black/60 px-1.5 py-0.5 rounded-full border border-cyan-500/30">
                      {currentAltitude}م
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          TOP & BOTTOM OVERLAY PANELS
          ========================================================================= */}
      {/* Top Banner: Question Title & Round Status */}
      <header className="relative z-30 w-full max-w-6xl mx-auto p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs font-bold text-zinc-300 backdrop-blur-md">
            الجولة {flyingState.roundNumber} من {flyingState.totalRounds}
          </div>
          <span className="font-sans font-black text-sm sm:text-base text-white drop-shadow truncate max-w-md">
            {flyingState.currentQuestion.title}
          </span>
        </div>

        {/* Global Overview Next Round Counter */}
        {flyingState.cameraMode === 'global_overview' && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-amber-400 font-bold bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30 animate-pulse">
              {flyingState.roundNumber >= flyingState.totalRounds
                ? `التتويج خلال ${autoAdvanceSeconds}ث`
                : `السؤال التالي خلال ${autoAdvanceSeconds}ث`}
            </span>
          </div>
        )}
      </header>

      {/* Bottom Global Leaderboard Bar during Overview */}
      {flyingState.cameraMode === 'global_overview' && (
        <footer className="relative z-30 w-full max-w-5xl mx-auto p-4 mb-2 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-full bg-zinc-950/90 border border-zinc-800 rounded-2xl p-3 backdrop-blur-md flex items-center justify-between gap-3 shadow-2xl">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 shrink-0">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>ترتيب الارتفاع:</span>
            </div>

            <div className="flex-1 flex items-center gap-2 overflow-x-auto py-1">
              {getRankedFlyingContestants(
                flyingState.cumulativeMeters,
                mergedContestants,
                flyingState.results
              ).map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-2 px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs shrink-0"
                >
                  <span
                    className={`font-mono font-bold ${
                      player.rank === 1
                        ? 'text-amber-400'
                        : player.rank === 2
                        ? 'text-zinc-300'
                        : 'text-amber-600'
                    }`}
                  >
                    #{player.rank}
                  </span>
                  <span className="font-black text-white truncate max-w-[90px]">
                    {player.name}
                  </span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {player.totalMeters}م
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                if (flyingState.roundNumber >= flyingState.totalRounds) {
                  syncState({ ...stateRef.current, phase: 'PODIUM' });
                } else {
                  startQuestionRound(flyingState.roundNumber + 1, flyingState.usedQuestionIds);
                }
              }}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs shrink-0 active:scale-95 transition-transform cursor-pointer"
            >
              {flyingState.roundNumber >= flyingState.totalRounds ? 'التتويج' : 'تخطي'}
            </button>
          </div>
        </footer>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// Small Subcomponent: Tier Badge
// -------------------------------------------------------------
function TierBadge({ tier, meters }: { tier: FlyingTier; meters: number }) {
  switch (tier) {
    case 'legendary':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 font-mono text-xs font-black">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          أسطوري 🔥 (+{meters}م)
        </span>
      );
    case 'rare':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400 text-purple-300 font-mono text-xs font-black">
          <Zap className="w-3.5 h-3.5 text-purple-400" />
          نادر 💎 (+{meters}م)
        </span>
      );
    case 'uncommon':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-mono text-xs font-black">
          غير شائع (+{meters}م)
        </span>
      );
    case 'common':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-xs font-bold">
          شائع (+{meters}م)
        </span>
      );
    case 'duplicated':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500 text-red-400 font-mono text-xs font-black">
          <FlameKindling className="w-3.5 h-3.5 text-red-400" />
          مكرر ومحترق 💥 (0م)
        </span>
      );
    case 'failed':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500 text-rose-400 font-mono text-xs font-black">
          <XCircle className="w-3.5 h-3.5 text-rose-400" />
          إجابة خاطئة ❌ (0م)
        </span>
      );
  }
}
