import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useRoom, roomBus } from '../../../lib/roomBus';
import { useRoomSync } from '../../../hooks/useRoomSync';
import { sound } from '../../../lib/audio';
import {
  getOrCreatePlayerId,
  getOrCreatePlayerName,
  getPersistedPlayerName,
} from '../../../utils/playerSession';
import { UnifiedShabahLobby } from '../../../components/lobby/UnifiedShabahLobby';
import {
  FlyingRoomState,
  FlyingSubmission,
  FlyingContestantResult,
  FlyingTier,
} from './types';
import {
  createInitialFlyingState,
  getPersistedFlyingState,
  savePersistedFlyingState,
  clearPersistedFlyingState,
  getRankedFlyingContestants,
} from './flyingSync';
import { getRandomFlyingQuestion } from './flyingQuestions';
import { evaluateFlyingAnswers } from './flyingEngine';
import {
  Rocket,
  Flame,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  Trophy,
  Crown,
  Zap,
  FlameKindling,
  XCircle,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';

const MAX_SKY_METERS = 1500;
const ROUND_TIME = 35;

export const FlyingMobileView: React.FC = () => {
  const { code } = useParams<{ code?: string }>();
  const [searchParams] = useSearchParams();
  const roomCode = (code || 'SHBH').trim().toUpperCase();
  const navigate = useNavigate();
  const isPlayerHost = searchParams.get('host') === '1';

  const [playerId] = useState<string>(() => getOrCreatePlayerId());
  const [playerName] = useState<string>(() => {
    return getPersistedPlayerName() || getOrCreatePlayerName('متسابق');
  });

  const { connectedPlayers: realtimeContestants } = useRoomSync({
    roomCode,
    role: 'contestant',
    playerId,
    playerName,
  });

  const { room } = useRoom(roomCode);
  const activeRoom = room || roomBus.getRoom(roomCode);

  const [flyingState, setFlyingState] = useState<FlyingRoomState>(
    () => getPersistedFlyingState(roomCode) || createInitialFlyingState(roomCode)
  );
  const stateRef = useRef<FlyingRoomState>(flyingState);
  stateRef.current = flyingState;

  const [answerInput, setAnswerInput] = useState<string>('');
  const [hasSubmittedThisRound, setHasSubmittedThisRound] = useState<boolean>(false);
  const [submittedAnswer, setSubmittedAnswer] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [animatingMeters, setAnimatingMeters] = useState<Record<string, number>>({});
  const [autoAdvanceSeconds, setAutoAdvanceSeconds] = useState<number>(6);

  const mergedContestants =
    realtimeContestants.length > 0
      ? realtimeContestants
      : (activeRoom?.players || []).filter((p) => p.id !== 'host_tv');

  const syncState = useCallback(
    (newState: FlyingRoomState) => {
      stateRef.current = newState;
      setFlyingState(newState);
      savePersistedFlyingState(roomCode, newState);
      roomBus.safeBroadcast(roomCode, 'FLYING_STATE_SYNC', newState);
    },
    [roomCode]
  );

  // Start a question round (used when isPlayerHost is true or triggered locally)
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

      setHasSubmittedThisRound(false);
      setAnswerInput('');
      setSubmittedAnswer('');
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
    setHasSubmittedThisRound(false);
    setAnswerInput('');
    setSubmittedAnswer('');
    syncState(lobbyState);
    roomBus.broadcastReturnToLobby(roomCode);
  }, [roomCode, syncState]);

  // Execute AI Evaluation when acting as Player-Host
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
      syncState(calcState);

      const submissionsList: FlyingSubmission[] = [];
      const processedIds = new Set<string>();

      // Include current player first if not in mergedContestants
      const allContestants =
        mergedContestants.length > 0
          ? mergedContestants
          : [{ id: playerId, name: playerName }];

      allContestants.forEach((c) => {
        processedIds.add(c.id);
        const sub = subs[c.id];
        submissionsList.push({
          contestantId: c.id,
          contestantName: c.name,
          answer: sub?.answer || '',
          submittedAt: sub?.submittedAt || Date.now(),
        });
      });

      Object.values(subs).forEach((s) => {
        if (!processedIds.has(s.contestantId)) {
          processedIds.add(s.contestantId);
          submissionsList.push(s);
        }
      });

      const evaluatedResults = await evaluateFlyingAnswers(
        curr.currentQuestion,
        submissionsList,
        curr.cumulativeMeters
      );

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

      syncState(revealingState);
      roomBus.safeBroadcast(roomCode, 'FLYING_RESULTS_READY', {
        results: resultMap,
        roundNumber: curr.roundNumber,
      });
    },
    [mergedContestants, playerId, playerName, roomCode, syncState]
  );

  // Question Timer Countdown (runs when isPlayerHost is true)
  useEffect(() => {
    if (!isPlayerHost || flyingState.phase !== 'QUESTION') return;

    const timer = setInterval(() => {
      setFlyingState((prev) => {
        if (prev.phase !== 'QUESTION') return prev;
        if (prev.timerSeconds <= 1) {
          clearInterval(timer);
          executeEvaluation();
          return { ...prev, timerSeconds: 0 };
        }
        const updated = { ...prev, timerSeconds: prev.timerSeconds - 1 };
        stateRef.current = updated;
        return updated;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlayerHost, flyingState.phase, executeEvaluation]);

  // Spotlight Camera Progression (runs when isPlayerHost is true during REVEALING)
  useEffect(() => {
    if (flyingState.phase !== 'REVEALING') return;

    const activeIndex = flyingState.activeSpotlightIndex;
    const contestantsList =
      mergedContestants.length > 0
        ? mergedContestants
        : Object.keys(flyingState.results).map((id) => ({
            id,
            name: flyingState.results[id]?.contestantName || 'متسابق',
          }));
    const totalContestants = Math.max(1, contestantsList.length);

    if (flyingState.cameraMode === 'spotlight') {
      const activeContestant = contestantsList[activeIndex];
      const res = activeContestant ? flyingState.results[activeContestant.id] : null;

      if (res && res.roundMeters > 0) {
        sound.playSuccess();
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

      if (!isPlayerHost) return;

      const advanceTimer = setTimeout(() => {
        if (activeIndex + 1 < totalContestants) {
          syncState({
            ...stateRef.current,
            activeSpotlightIndex: activeIndex + 1,
            cameraMode: 'spotlight',
          });
        } else {
          sound.playVictory();
          syncState({
            ...stateRef.current,
            cameraMode: 'global_overview',
          });
          setAutoAdvanceSeconds(6);
        }
      }, 3600);

      return () => clearTimeout(advanceTimer);
    } else if (flyingState.cameraMode === 'global_overview' && isPlayerHost) {
      const overviewTimer = setInterval(() => {
        setAutoAdvanceSeconds((sec) => {
          if (sec <= 1) {
            clearInterval(overviewTimer);
            if (flyingState.roundNumber >= flyingState.totalRounds) {
              syncState({
                ...stateRef.current,
                phase: 'PODIUM',
              });
              sound.playVictory();
            } else {
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
    isPlayerHost,
    flyingState.phase,
    flyingState.activeSpotlightIndex,
    flyingState.cameraMode,
    flyingState.roundNumber,
    flyingState.totalRounds,
    flyingState.usedQuestionIds,
    flyingState.results,
    mergedContestants,
    startQuestionRound,
    syncState,
  ]);

  // Synchronize with TV host / other contestants
  useEffect(() => {
    const unsubSync = roomBus.on('FLYING_STATE_SYNC', (evt: any) => {
      const incomingCode = evt?.roomCode;
      const payload: FlyingRoomState = evt?.data ?? evt;
      if (incomingCode && incomingCode !== roomCode) return;
      if (!payload) return;

      stateRef.current = payload;
      setFlyingState(payload);
      savePersistedFlyingState(roomCode, payload);

      if (payload.phase === 'QUESTION') {
        const mySub = payload.submissions?.[playerId];
        if (mySub) {
          setHasSubmittedThisRound(true);
          setSubmittedAnswer(mySub.answer);
        } else {
          setHasSubmittedThisRound(false);
          setAnswerInput('');
          setSubmittedAnswer('');
        }
      }
    });

    const unsubGameStarted = roomBus.on('GAME_STARTED', (evt: any) => {
      const incomingCode = evt?.roomCode;
      if (incomingCode && incomingCode !== roomCode) return;
      if (stateRef.current.phase === 'LOBBY') {
        handleStartGame();
      }
    });

    const unsubAnswer = roomBus.on('FLYING_SUBMIT_ANSWER', (evt: any) => {
      if (!isPlayerHost) return;
      const incomingCode = evt?.roomCode;
      const payload = evt?.data ?? evt;
      if (incomingCode && incomingCode !== roomCode) return;
      if (!payload || !payload.contestantId) return;

      const curr = stateRef.current;
      if (curr.phase !== 'QUESTION') return;

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

      const connectedCount = Math.max(1, mergedContestants.length);
      const submittedCount = Object.keys(updatedSubmissions).length;
      if (submittedCount >= connectedCount) {
        executeEvaluation(updatedSubmissions);
      } else {
        syncState(updatedState);
      }
    });

    const unsubResults = roomBus.on('FLYING_RESULTS_READY', (evt: any) => {
      const incomingCode = evt?.roomCode;
      const payload = evt?.data ?? evt;
      if (incomingCode && incomingCode !== roomCode) return;
      if (payload?.results) {
        setFlyingState((prev) => ({
          ...prev,
          phase: 'REVEALING',
          results: payload.results,
        }));
      }
    });

    const unsubReturn = roomBus.on('RETURN_TO_LOBBY', (evt: any) => {
      const incomingCode = evt?.roomCode;
      if (incomingCode && incomingCode !== roomCode) return;
      setFlyingState((prev) => ({
        ...prev,
        phase: 'LOBBY',
        submissions: {},
        results: {},
      }));
      setHasSubmittedThisRound(false);
      setAnswerInput('');
    });

    return () => {
      unsubSync?.();
      unsubGameStarted?.();
      unsubAnswer?.();
      unsubResults?.();
      unsubReturn?.();
    };
  }, [roomCode, playerId, isPlayerHost, mergedContestants.length, executeEvaluation, handleStartGame, syncState]);

  // Submit Answer
  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = answerInput.trim();
    if (!clean || hasSubmittedThisRound || isSubmitting) return;

    sound.playClick();
    setIsSubmitting(true);
    setHasSubmittedThisRound(true);
    setSubmittedAnswer(clean);

    const mySubmission: FlyingSubmission = {
      contestantId: playerId,
      contestantName: playerName,
      answer: clean,
      submittedAt: Date.now(),
    };

    roomBus.safeBroadcast(roomCode, 'FLYING_SUBMIT_ANSWER', {
      ...mySubmission,
      roomCode,
    });

    if (isPlayerHost) {
      const curr = stateRef.current;
      const updatedSubmissions = {
        ...curr.submissions,
        [playerId]: mySubmission,
      };
      const updatedState: FlyingRoomState = {
        ...curr,
        submissions: updatedSubmissions,
      };
      stateRef.current = updatedState;
      setFlyingState(updatedState);
      savePersistedFlyingState(roomCode, updatedState);

      const connectedCount = Math.max(1, mergedContestants.length);
      const submittedCount = Object.keys(updatedSubmissions).length;
      if (submittedCount >= connectedCount) {
        setTimeout(() => {
          executeEvaluation(updatedSubmissions);
        }, 300);
      } else {
        syncState(updatedState);
      }
    }

    setTimeout(() => {
      setIsSubmitting(false);
    }, 400);
  };

  const myResult: FlyingContestantResult | undefined = flyingState.results[playerId];
  const myTotalMeters = flyingState.cumulativeMeters[playerId] || 0;
  const q = flyingState.currentQuestion;

  // -------------------------------------------------------------
  // 1. Lobby Phase
  // -------------------------------------------------------------
  if (flyingState.phase === 'LOBBY') {
    return (
      <UnifiedShabahLobby
        roomCode={roomCode}
        gameId="ai-flying"
        gameTitle="الشبح الطائر"
        role="contestant"
        isPlayerHost={isPlayerHost}
        currentPlayerId={playerId}
        onStartGame={handleStartGame}
        onExit={() => {
          roomBus.leavePlayer(roomCode, playerId);
          navigate('/');
        }}
      />
    );
  }

  // -------------------------------------------------------------
  // 2. Podium Phase
  // -------------------------------------------------------------
  if (flyingState.phase === 'PODIUM') {
    const ranked = getRankedFlyingContestants(
      flyingState.cumulativeMeters,
      mergedContestants.length > 0 ? mergedContestants : [{ id: playerId, name: playerName }],
      flyingState.results
    );
    const first = ranked[0];
    const second = ranked[1];
    const third = ranked[2];

    return (
      <div
        dir="rtl"
        className="min-h-screen min-h-[100dvh] w-full bg-[#030305] text-white flex flex-col justify-between p-6 select-none relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-purple-950/20 to-black pointer-events-none" />

        <header className="relative z-10 flex flex-col items-center text-center gap-2 pt-4">
          <Trophy className="w-12 h-12 text-amber-400 animate-bounce" />
          <h1 className="font-sans font-black text-2xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">
            سادة سماء شبح
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm">
            بعد ٥ جولات نارية من التنافس والتحليق بالأجوبة النادرة!
          </p>
        </header>

        {/* Podium Display */}
        <div className="relative z-10 w-full max-w-lg mx-auto flex items-end justify-center gap-3 my-auto pt-8 pb-4">
          {second && (
            <div className="flex-1 flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center text-2xl mb-2">
                🛸
              </div>
              <span className="font-sans font-black text-xs sm:text-sm text-zinc-200 truncate max-w-[100px]">
                {second.name}
              </span>
              <span className="font-mono text-xs font-black text-cyan-400">{second.totalMeters} م</span>
              <div className="w-full h-24 rounded-t-xl bg-gradient-to-t from-zinc-800 to-zinc-700 border-t-4 border-zinc-400 flex items-center justify-center text-zinc-300 font-black text-xl mt-2">
                2
              </div>
            </div>
          )}

          {first && (
            <div className="flex-1 flex flex-col items-center z-20">
              <div className="relative">
                <Crown className="w-7 h-7 text-amber-400 absolute -top-7 left-1/2 -translate-x-1/2 animate-bounce" />
                <div className="w-18 h-18 rounded-2xl bg-gradient-to-b from-amber-500/20 to-zinc-900 border-2 border-amber-400 flex items-center justify-center text-3xl mb-2 shadow-[0_0_25px_rgba(251,191,36,0.4)]">
                  👑
                </div>
              </div>
              <span className="font-sans font-black text-sm sm:text-base text-amber-300 truncate max-w-[120px]">
                {first.name}
              </span>
              <span className="font-mono text-sm font-black text-amber-400">{first.totalMeters} م 🚀</span>
              <div className="w-full h-36 rounded-t-xl bg-gradient-to-t from-amber-600/40 via-amber-500/30 to-amber-400 border-t-4 border-amber-300 flex items-center justify-center text-amber-950 font-black text-2xl mt-2">
                1
              </div>
            </div>
          )}

          {third && (
            <div className="flex-1 flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border-2 border-amber-800/60 flex items-center justify-center text-2xl mb-2">
                🚀
              </div>
              <span className="font-sans font-black text-xs sm:text-sm text-amber-600 truncate max-w-[100px]">
                {third.name}
              </span>
              <span className="font-mono text-xs font-black text-cyan-400">{third.totalMeters} م</span>
              <div className="w-full h-18 rounded-t-xl bg-gradient-to-t from-zinc-900 to-amber-900/40 border-t-4 border-amber-700 flex items-center justify-center text-amber-600 font-black text-xl mt-2">
                3
              </div>
            </div>
          )}
        </div>

        <footer className="relative z-10 flex items-center justify-center gap-3 w-full max-w-md mx-auto">
          {isPlayerHost && (
            <button
              type="button"
              onClick={handleStartGame}
              className="flex-1 py-3.5 px-4 rounded-2xl font-black text-sm text-black bg-gradient-to-r from-amber-300 to-yellow-400 active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>لعبة جديدة</span>
            </button>
          )}
          <button
            type="button"
            onClick={isPlayerHost ? handleReturnToLobby : () => navigate('/')}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-zinc-900 border border-zinc-700 font-black text-sm text-white active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>{isPlayerHost ? 'العودة للوبي' : 'خروج للرئيسية'}</span>
          </button>
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. Question Answering Phase
  // -------------------------------------------------------------
  if (flyingState.phase === 'QUESTION' || flyingState.phase === 'CALCULATING') {
    return (
      <div
        dir="rtl"
        className="min-h-screen min-h-[100dvh] w-full bg-[#050508] text-white flex flex-col justify-between p-5 select-none relative overflow-hidden"
      >
        {/* Background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-950/30 to-black pointer-events-none" />

        {/* Top Header */}
        <header className="relative z-10 w-full max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-mono text-xs font-bold">
              السؤال {flyingState.roundNumber} من {flyingState.totalRounds}
            </span>
          </div>

          {/* Current Altitude Counter Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-black">
            <span>ارتفاعك الحالي:</span>
            <span>{myTotalMeters}م 🛸</span>
          </div>
        </header>

        {/* Main Content Card */}
        <main className="relative z-10 w-full max-w-xl mx-auto flex flex-col my-auto py-4">
          {flyingState.phase === 'CALCULATING' ? (
            <div className="bg-zinc-950 border-2 border-indigo-500/40 rounded-3xl p-8 shadow-xl flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-400 animate-spin mb-5" />
              <h2 className="font-sans font-black text-xl sm:text-2xl text-white mb-2">
                الشبح يحسب ندرة إجابتك وأمتار الطيران...
              </h2>
              <p className="text-zinc-400 text-xs sm:text-sm">
                جاري فحص التكرارات وتجهيز الصواريخ للإقلاع!
              </p>
            </div>
          ) : (
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col items-center text-center">
              <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 text-xs font-bold mb-3">
                تصنيف: {q.category}
              </span>

              <h2 className="font-sans font-black text-xl sm:text-2xl text-white leading-snug mb-3">
                {q.title}
              </h2>

              <p className="text-xs sm:text-sm text-zinc-400 font-medium flex items-center gap-1.5 mb-6">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{q.examplesHint}</span>
              </p>

              {/* Form Input or Confirmed Status */}
              {!hasSubmittedThisRound ? (
                <form onSubmit={handleSubmitAnswer} className="w-full flex flex-col gap-3">
                  <input
                    type="text"
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    placeholder="اكتب أندر إجابة صحيحة تخطر ببالك..."
                    maxLength={60}
                    className="w-full py-4 px-5 rounded-2xl bg-zinc-900 border-2 border-zinc-700 text-white font-sans font-bold text-center text-base placeholder:text-zinc-600 focus:outline-none focus:border-cyan-400 transition-colors"
                    autoFocus
                  />

                  <button
                    type="submit"
                    disabled={!answerInput.trim() || isSubmitting}
                    className={`w-full py-4 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 cursor-pointer ${
                      answerInput.trim() && !isSubmitting
                        ? 'bg-gradient-to-r from-cyan-400 to-indigo-500 text-black shadow-cyan-500/20'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                    }`}
                  >
                    <Rocket className="w-5 h-5" />
                    <span>أطلق الشبح 🚀</span>
                  </button>
                </form>
              ) : (
                // Submitted Confirmation State
                <div className="w-full py-6 flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 duration-300">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="font-sans font-black text-lg text-emerald-400 mb-1">
                      تم تثبيت إجابتك بنجاح!
                    </h3>
                    <p className="text-xs text-zinc-400 font-medium">
                      بانتظار بقية المتسابقين للإقلاع في سماء شبح...
                    </p>
                  </div>

                  <div className="px-5 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-white font-sans font-black text-base mt-2">
                    "{submittedAnswer}"
                  </div>

                  {isPlayerHost && (
                    <button
                      type="button"
                      onClick={() => executeEvaluation()}
                      className="mt-3 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-xs font-bold text-cyan-300 cursor-pointer"
                    >
                      إنهاء الوقت وإطلاق الأشباح الآن 🚀
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Footer Countdown */}
        <footer className="relative z-10 w-full flex items-center justify-center">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-400 bg-zinc-900/80 px-4 py-1.5 rounded-full border border-zinc-800">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>المتبقي: {flyingState.timerSeconds} ثانية</span>
          </div>
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 4. Revealing Phase: Interactive Sky World + Personal Result
  // -------------------------------------------------------------
  const contestantsList =
    mergedContestants.length > 0
      ? mergedContestants
      : Object.keys(flyingState.results).map((id) => ({
          id,
          name: flyingState.results[id]?.contestantName || 'متسابق',
        }));

  const activeSpotlightContestant = contestantsList[flyingState.activeSpotlightIndex];
  const activeSpotlightResult = activeSpotlightContestant
    ? flyingState.results[activeSpotlightContestant.id]
    : null;
  const activeGhostMeters = activeSpotlightResult ? activeSpotlightResult.newTotalMeters : 0;

  const skyPercent = (meters: number) => {
    return Math.min(92, Math.max(8, (meters / MAX_SKY_METERS) * 84 + 8));
  };

  return (
    <div
      dir="rtl"
      className="h-screen max-h-screen w-full bg-[#020204] text-white flex flex-col justify-between overflow-hidden relative select-none"
    >
      {/* Vertical Sky World Canvas */}
      <div
        className="absolute inset-0 transition-transform duration-1000 ease-out origin-center"
        style={{
          transform:
            flyingState.cameraMode === 'spotlight'
              ? `scale(1.22) translateY(${Math.min(15, Math.max(-15, (skyPercent(activeGhostMeters) - 50) * 0.4))}%)`
              : 'scale(1) translateY(0%)',
        }}
      >
        <div
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, #080c14 0%, #0c1829 10%, #11294d 25%, #183d6e 40%, #2b2866 60%, #1e1145 80%, #08031a 100%)',
          }}
        />

        {/* Deep Space Stars */}
        <div className="absolute top-0 left-0 right-0 h-[30%] pointer-events-none overflow-hidden opacity-85">
          <div className="absolute top-6 left-10 w-14 h-14 rounded-full bg-gradient-to-tr from-amber-200 to-yellow-100 shadow-[0_0_30px_rgba(254,240,138,0.6)]" />
          <div className="absolute inset-0 bg-[radial-gradient(1px_1px_at_20px_30px,#fff,rgba(0,0,0,0))] bg-[length:40px_40px] opacity-70" />
        </div>

        {/* Altitude Ruler Markings */}
        <div className="absolute top-0 bottom-0 left-2 w-12 flex flex-col justify-between py-12 pointer-events-none text-[10px] font-mono font-bold text-zinc-500 z-10 border-r border-zinc-800/40">
          {[1500, 1200, 900, 600, 300, 0].map((m) => (
            <div key={m} className="flex items-center gap-1">
              <span>{m}م</span>
              <div className="w-1.5 h-[1px] bg-zinc-700" />
            </div>
          ))}
        </div>

        {/* Contestants' Flying Ghosts */}
        <div className="absolute inset-0 px-12 flex justify-around items-end pb-10 pointer-events-none z-20">
          {contestantsList.map((c, index) => {
            const isSpotlight =
              flyingState.cameraMode === 'spotlight' &&
              index === flyingState.activeSpotlightIndex;

            const res = flyingState.results[c.id];
            const prevMeters = res ? res.previousTotalMeters : 0;
            const finalMeters = res ? res.newTotalMeters : prevMeters;

            const currentAltitude =
              isSpotlight || flyingState.cameraMode === 'global_overview'
                ? finalMeters
                : prevMeters;

            const bottomPercentage = skyPercent(currentAltitude);

            return (
              <div
                key={c.id}
                className="relative flex flex-col items-center transition-all duration-[2000ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  bottom: `${bottomPercentage}%`,
                  zIndex: isSpotlight ? 40 : 20,
                  opacity: flyingState.cameraMode === 'spotlight' && !isSpotlight ? 0.45 : 1,
                }}
              >
                {isSpotlight && res && (
                  <div className="absolute -top-36 flex flex-col items-center text-center w-60 sm:w-72 animate-in fade-in zoom-in-95 duration-500">
                    <div className="bg-zinc-950/95 border-2 border-white/20 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex flex-col items-center gap-1 w-full">
                      <MobileTierBadge tier={res.tier} meters={res.roundMeters} />
                      <span className="font-sans font-black text-base sm:text-lg text-white truncate max-w-full">
                        "{res.answer || 'بدون إجابة'}"
                      </span>
                      <span className="text-[11px] text-zinc-300 font-medium leading-tight">
                        {res.comment}
                      </span>
                      {res.roundMeters > 0 && (
                        <span className="font-mono text-xs font-black text-emerald-400">
                          +{animatingMeters[c.id] || res.roundMeters} متر
                        </span>
                      )}
                    </div>
                    <div className="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-zinc-950" />
                  </div>
                )}

                <div
                  className={`relative flex flex-col items-center transition-transform duration-300 ${
                    isSpotlight ? 'scale-125' : 'scale-100'
                  }`}
                >
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl border-2 shadow-lg ${
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

                  {isSpotlight && res && res.roundMeters > 0 && (
                    <div className="flex flex-col items-center animate-bounce -mt-1">
                      <Flame className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />
                    </div>
                  )}

                  <div className="mt-1 flex flex-col items-center text-center">
                    <span className="font-sans font-black text-[11px] text-white drop-shadow truncate max-w-[85px]">
                      {c.name}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-cyan-300 bg-black/70 px-1.5 py-0.5 rounded-full border border-cyan-500/30">
                      {currentAltitude}م
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Overlay Header */}
      <header className="relative z-30 w-full max-w-xl mx-auto p-4 flex items-center justify-between">
        <span className="px-3 py-1 rounded-xl bg-zinc-950/85 border border-zinc-800 font-mono text-xs font-bold text-zinc-300">
          الجولة {flyingState.roundNumber} من {flyingState.totalRounds}
        </span>
        <span className="font-mono text-xs font-black text-cyan-400 bg-zinc-950/85 px-3 py-1 rounded-xl border border-cyan-500/30">
          إجمالي ارتفاعك: {myTotalMeters}م 🛸
        </span>
      </header>

      {/* Bottom Personal Summary & Next Round Bar */}
      <footer className="relative z-30 w-full max-w-xl mx-auto p-4 flex flex-col gap-2">
        {myResult && (
          <div className="w-full bg-zinc-950/90 border border-zinc-800 rounded-2xl p-3 backdrop-blur-md flex items-center justify-between gap-3 shadow-2xl">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xl shrink-0">
                {myResult.roundMeters > 0 ? '🚀' : '💨'}
              </div>
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <span className="font-sans font-black text-sm text-white truncate">
                    "{myResult.answer || 'بدون إجابة'}"
                  </span>
                  <span className="font-mono text-xs font-black text-emerald-400">
                    +{myResult.roundMeters}م
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 truncate">{myResult.comment}</p>
              </div>
            </div>

            {isPlayerHost && (
              <button
                type="button"
                onClick={() => {
                  if (flyingState.roundNumber >= flyingState.totalRounds) {
                    syncState({ ...stateRef.current, phase: 'PODIUM' });
                  } else {
                    startQuestionRound(
                      flyingState.roundNumber + 1,
                      flyingState.usedQuestionIds
                    );
                  }
                }}
                className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs shrink-0 active:scale-95 transition-transform cursor-pointer"
              >
                {flyingState.roundNumber >= flyingState.totalRounds
                  ? 'التتويج 🏆'
                  : flyingState.cameraMode === 'global_overview'
                  ? `التالي (${autoAdvanceSeconds}ث)`
                  : 'تخطي ⏭️'}
              </button>
            )}
          </div>
        )}
      </footer>
    </div>
  );
};

function MobileTierBadge({ tier, meters }: { tier: FlyingTier; meters: number }) {
  switch (tier) {
    case 'legendary':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 font-mono text-[11px] font-black">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          أسطوري 🔥 (+{meters}م)
        </span>
      );
    case 'rare':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400 text-purple-300 font-mono text-[11px] font-black">
          <Zap className="w-3.5 h-3.5 text-purple-400" />
          نادر 💎 (+{meters}م)
        </span>
      );
    case 'uncommon':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-mono text-[11px] font-black">
          غير شائع (+{meters}م)
        </span>
      );
    case 'common':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-[11px] font-bold">
          شائع (+{meters}م)
        </span>
      );
    case 'duplicated':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500 text-red-400 font-mono text-[11px] font-black">
          <FlameKindling className="w-3.5 h-3.5 text-red-400" />
          مكرر ومحترق 💥 (0م)
        </span>
      );
    case 'failed':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500 text-rose-400 font-mono text-[11px] font-black">
          <XCircle className="w-3.5 h-3.5 text-rose-400" />
          إجابة خاطئة ❌ (0م)
        </span>
      );
  }
}
