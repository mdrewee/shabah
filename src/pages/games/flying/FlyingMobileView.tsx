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
} from './types';
import {
  createInitialFlyingState,
  getPersistedFlyingState,
  savePersistedFlyingState,
  clearPersistedFlyingState,
  getRankedFlyingContestants,
} from './flyingSync';
import { getRandomFlyingQuestion } from './flyingQuestions';
import { evaluateFlyingAnswers, stripEmojis } from './flyingEngine';
import { FlyingSkyWorld } from './FlyingSkyWorld';
import { GhostAvatar, getTierDisplayLabel } from './GhostAvatar';
import {
  CheckCircle2,
  Clock,
  Trophy,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';

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

  // Start a question round
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
    const freshState: FlyingRoomState = {
      ...createInitialFlyingState(roomCode),
      cumulativeMeters: {},
    };
    stateRef.current = freshState;
    startQuestionRound(1, []);
  }, [roomCode, startQuestionRound]);

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

      const allContestants =
        mergedContestants.length > 0
          ? mergedContestants
          : [{ id: playerId, name: playerName }];

      // 1. Gather all connected contestants with resilient lookup (by ID, playerId, or name)
      allContestants.forEach((c) => {
        processedIds.add(c.id);
        const sub =
          subs[c.id] ||
          Object.values(subs).find(
            (s: any) =>
              s.contestantId === c.id ||
              s.playerId === c.id ||
              (s.contestantName &&
                c.name &&
                s.contestantName.trim().toLowerCase() === c.name.trim().toLowerCase())
          );

        submissionsList.push({
          contestantId: c.id,
          contestantName: c.name,
          answer: stripEmojis(sub?.answer || ''),
          submittedAt: sub?.submittedAt || Date.now(),
        });
      });

      // 2. Include any other submissions in subs
      Object.values(subs).forEach((s: any) => {
        const sId = s.contestantId || s.playerId || s.id;
        if (sId && !processedIds.has(sId)) {
          processedIds.add(sId);
          submissionsList.push({
            contestantId: sId,
            contestantName: s.contestantName || s.playerName || 'متسابق',
            answer: stripEmojis(s.answer || ''),
            submittedAt: s.submittedAt || Date.now(),
          });
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
      if (!payload) return;

      const contestantId = String(payload.contestantId || payload.playerId || payload.id || '');
      if (!contestantId) return;

      const contestantName = String(payload.contestantName || payload.playerName || payload.name || 'متسابق');
      const rawAnswer = payload.answer !== undefined ? payload.answer : payload.text !== undefined ? payload.text : payload.rawAnswer;
      const answer = stripEmojis(String(rawAnswer || '').trim());

      const curr = stateRef.current;
      if (curr.phase !== 'QUESTION') return;

      const newSub: FlyingSubmission = {
        contestantId,
        contestantName,
        answer,
        submittedAt: payload.submittedAt || Date.now(),
      };

      const updatedSubmissions = {
        ...curr.submissions,
        [contestantId]: newSub,
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
  }, [
    roomCode,
    playerId,
    isPlayerHost,
    mergedContestants.length,
    executeEvaluation,
    handleStartGame,
    syncState,
  ]);

  // Submit Answer
  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = stripEmojis(answerInput.trim());
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

    const submitPayload = {
      ...mySubmission,
      playerId,
      playerName,
      roundIndex: flyingState.roundNumber,
      roomCode,
    };

    // Broadcast across all socket channels for guaranteed arrival
    roomBus.broadcast('FLYING_SUBMIT_ANSWER', submitPayload);
    roomBus.safeBroadcast(roomCode, 'FLYING_SUBMIT_ANSWER', submitPayload);
    roomBus.emit('FLYING_SUBMIT_ANSWER', roomCode, submitPayload);
    if ((roomBus as any).broadcastFlyingAnswer) {
      (roomBus as any).broadcastFlyingAnswer(roomCode, submitPayload);
    }

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
  const myColorIndex = Math.max(
    0,
    mergedContestants.findIndex((c) => c.id === playerId)
  );

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
  // 2. Podium Phase (Clean Flat Design, Zero Emojis)
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
        className="min-h-screen min-h-[100dvh] w-full bg-[#090D16] text-white flex flex-col justify-between p-6 select-none overflow-hidden"
      >
        <header className="flex flex-col items-center text-center gap-2 pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-400 text-black border-2 border-black font-sans text-xs font-black">
            <Trophy className="w-4 h-4 text-black" />
            <span>النتائج النهائية</span>
          </div>
          <h1 className="font-sans font-black text-2xl sm:text-3xl text-white">
            أبطال الشبح الطائر
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm font-bold">
            الترتيب النهائي بعد 5 جولات
          </p>
        </header>

        {/* Podium Display */}
        <div className="w-full max-w-lg mx-auto flex items-end justify-center gap-3 my-auto pt-6 pb-4">
          {second && (
            <div className="flex-1 flex flex-col items-center">
              <GhostAvatar
                name={second.name}
                colorIndex={1}
                totalMeters={second.totalMeters}
                size="sm"
              />
              <div className="w-full h-24 rounded-t-xl bg-zinc-800 border-2 border-black flex items-center justify-center text-white font-black text-2xl mt-2">
                2
              </div>
            </div>
          )}

          {first && (
            <div className="flex-1 flex flex-col items-center z-20">
              <GhostAvatar
                name={first.name}
                colorIndex={0}
                totalMeters={first.totalMeters}
                size="md"
              />
              <div className="w-full h-36 rounded-t-xl bg-amber-400 border-2 border-black flex items-center justify-center text-black font-black text-3xl mt-2">
                1
              </div>
            </div>
          )}

          {third && (
            <div className="flex-1 flex flex-col items-center">
              <GhostAvatar
                name={third.name}
                colorIndex={2}
                totalMeters={third.totalMeters}
                size="sm"
              />
              <div className="w-full h-18 rounded-t-xl bg-orange-600 border-2 border-black flex items-center justify-center text-white font-black text-2xl mt-2">
                3
              </div>
            </div>
          )}
        </div>

        <footer className="flex items-center justify-center gap-3 w-full max-w-md mx-auto">
          {isPlayerHost && (
            <button
              type="button"
              onClick={handleStartGame}
              className="flex-1 py-3.5 px-4 rounded-xl font-black text-sm text-black bg-white border-2 border-black active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>جولة جديدة</span>
            </button>
          )}
          <button
            type="button"
            onClick={isPlayerHost ? handleReturnToLobby : () => navigate('/')}
            className="flex-1 py-3.5 px-4 rounded-xl bg-zinc-900 border-2 border-zinc-700 font-black text-sm text-white active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>{isPlayerHost ? 'العودة للوبي' : 'خروج للرئيسية'}</span>
          </button>
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. Question Answering Phase (No Hints, Zero Emojis, Flat Style)
  // -------------------------------------------------------------
  if (flyingState.phase === 'QUESTION' || flyingState.phase === 'CALCULATING') {
    return (
      <div
        dir="rtl"
        className="min-h-screen min-h-[100dvh] w-full bg-[#090D16] text-white flex flex-col justify-between p-5 select-none overflow-hidden"
      >
        {/* Top Header */}
        <header className="w-full max-w-xl mx-auto flex items-center justify-between">
          <span className="px-3.5 py-1.5 rounded-xl bg-white text-black border-2 border-black font-sans text-xs font-black">
            السؤال {flyingState.roundNumber} من {flyingState.totalRounds}
          </span>

          <div className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border-2 border-zinc-700 text-white font-mono text-xs font-black">
            الارتفاع التراكمي: {myTotalMeters} متر
          </div>
        </header>

        {/* Main Content Card (Question Only, No Hints) */}
        <main className="w-full max-w-xl mx-auto flex flex-col my-auto py-4">
          {flyingState.phase === 'CALCULATING' ? (
            <div className="bg-white text-black border-4 border-black rounded-3xl p-8 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full border-4 border-zinc-300 border-t-black animate-spin mb-5" />
              <h2 className="font-sans font-black text-xl sm:text-2xl text-black mb-2">
                جاري تقييم ندرة الإجابات وحساب الأمتار
              </h2>
              <p className="text-zinc-600 font-bold text-xs sm:text-sm">
                يتم الآن فحص الإجابات المتكررة وتجهيز الطيران
              </p>
            </div>
          ) : (
            <div className="bg-white text-black border-4 border-black rounded-3xl p-6 flex flex-col items-center text-center">
              <span className="px-3.5 py-1 rounded-lg bg-zinc-900 text-white text-xs font-black mb-4">
                {q.category}
              </span>

              <h2 className="font-sans font-black text-xl sm:text-2xl text-black leading-snug mb-6">
                {q.title}
              </h2>

              {!hasSubmittedThisRound ? (
                <form onSubmit={handleSubmitAnswer} className="w-full flex flex-col gap-3">
                  <input
                    type="text"
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    placeholder="اكتب إجابتك هنا..."
                    maxLength={60}
                    className="w-full py-4 px-5 rounded-xl bg-zinc-100 border-2 border-black text-black font-sans font-black text-center text-base placeholder:text-zinc-500 focus:outline-none focus:bg-white"
                    autoFocus
                  />

                  <button
                    type="submit"
                    disabled={!answerInput.trim() || isSubmitting}
                    className={`w-full py-4 rounded-xl font-black text-base transition-transform active:scale-95 border-2 border-black flex items-center justify-center cursor-pointer ${
                      answerInput.trim() && !isSubmitting
                        ? 'bg-[#10B981] text-black'
                        : 'bg-zinc-300 text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    تأكيد الإجابة
                  </button>
                </form>
              ) : (
                <div className="w-full py-5 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#10B981] border-2 border-black flex items-center justify-center text-black">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>

                  <div>
                    <h3 className="font-sans font-black text-lg text-black mb-1">
                      تم تثبيت إجابتك بنجاح
                    </h3>
                    <p className="text-xs text-zinc-600 font-bold">
                      بانتظار انتهاء الوقت أو إجابة بقية المتسابقين
                    </p>
                  </div>

                  <div className="px-5 py-2.5 rounded-xl bg-zinc-100 border-2 border-black text-black font-sans font-black text-base mt-1">
                    "{submittedAnswer}"
                  </div>

                  {isPlayerHost && (
                    <button
                      type="button"
                      onClick={() => executeEvaluation()}
                      className="mt-2 px-4 py-2 rounded-xl bg-black text-white border-2 border-black text-xs font-black cursor-pointer"
                    >
                      إنهاء الوقت وبدء الطيران
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Footer Countdown */}
        <footer className="w-full flex items-center justify-center">
          <div className="flex items-center gap-2 text-xs font-mono font-black text-white bg-zinc-900 px-4 py-2 rounded-xl border-2 border-zinc-700">
            <Clock className="w-4 h-4 text-white" />
            <span>الوقت المتبقي: {flyingState.timerSeconds} ثانية</span>
          </div>
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 4. Revealing Phase: Vertical City-to-Sky World + Personal Summary
  // -------------------------------------------------------------
  const contestantsList =
    mergedContestants.length > 0
      ? mergedContestants
      : Object.keys(flyingState.results).map((id) => ({
          id,
          name: flyingState.results[id]?.contestantName || 'متسابق',
        }));

  const myTierInfo = getTierDisplayLabel(myResult?.tier);

  return (
    <div
      dir="rtl"
      className="h-screen max-h-screen w-full bg-[#0F172A] text-white flex flex-col justify-between overflow-hidden relative select-none"
    >
      {/* Vertical World & Camera Choreography */}
      <div className="absolute inset-0">
        <FlyingSkyWorld
          contestants={contestantsList}
          results={flyingState.results}
          cumulativeMeters={flyingState.cumulativeMeters}
          activeSpotlightIndex={flyingState.activeSpotlightIndex}
          cameraMode={flyingState.cameraMode}
        />
      </div>

      {/* Top Header */}
      <header className="relative z-30 w-full max-w-xl mx-auto p-3 flex items-center justify-between">
        <span className="px-3 py-1.5 rounded-xl bg-white text-black border-2 border-black font-sans text-xs font-black">
          الجولة {flyingState.roundNumber} من {flyingState.totalRounds}
        </span>
        <span className="font-mono text-xs font-black text-white bg-black px-3 py-1.5 rounded-xl border-2 border-white">
          الارتفاع الكلي: {myTotalMeters} متر
        </span>
      </header>

      {/* Bottom Personal Summary & Host Advance Control */}
      <footer className="relative z-30 w-full max-w-xl mx-auto p-3 flex flex-col gap-2">
        {myResult && (
          <div className="w-full bg-white text-black border-2 border-black rounded-2xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="shrink-0">
                <span
                  className="px-2.5 py-1 rounded-lg border-2 border-black font-sans font-black text-xs inline-block"
                  style={{
                    backgroundColor: myTierInfo.bgColor,
                    color: myTierInfo.textColor,
                  }}
                >
                  {myTierInfo.label}
                </span>
              </div>
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <span className="font-sans font-black text-sm text-black truncate">
                    "{myResult.answer || 'بدون إجابة'}"
                  </span>
                  <span className="font-mono text-xs font-black text-white bg-black px-2 py-0.5 rounded">
                    +{myResult.roundMeters} متر
                  </span>
                </div>
                <p className="text-[11px] font-bold text-zinc-700 truncate">
                  {myResult.comment}
                </p>
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
                className="px-4 py-2 rounded-xl bg-black text-white border-2 border-black font-black text-xs shrink-0 active:scale-95 transition-transform cursor-pointer"
              >
                {flyingState.roundNumber >= flyingState.totalRounds
                  ? 'التتويج'
                  : flyingState.cameraMode === 'global_overview'
                  ? `التالي (${autoAdvanceSeconds}ث)`
                  : 'تخطي'}
              </button>
            )}
          </div>
        )}
      </footer>
    </div>
  );
};
