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
} from './types';
import {
  createInitialFlyingState,
  savePersistedFlyingState,
  clearPersistedFlyingState,
  getRankedFlyingContestants,
} from './flyingSync';
import { getRandomFlyingQuestion } from './flyingQuestions';
import { evaluateFlyingAnswers, stripEmojis } from './flyingEngine';
import { FlyingSkyWorld } from './FlyingSkyWorld';
import { GhostAvatar, getGhostColor } from './GhostAvatar';
import {
  Trophy,
  ArrowRight,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
} from 'lucide-react';

const ROUND_TIME = 35;

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
  const [autoAdvanceSeconds, setAutoAdvanceSeconds] = useState<number>(6);
  const [tvTestAnswer, setTvTestAnswer] = useState<string>('');

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

      const submissionsList: FlyingSubmission[] = [];
      const processedIds = new Set<string>();

      mergedContestants.forEach((c) => {
        processedIds.add(c.id);
        const sub = subs[c.id];
        submissionsList.push({
          contestantId: c.id,
          contestantName: c.name,
          answer: stripEmojis(sub?.answer || ''),
          submittedAt: sub?.submittedAt || Date.now(),
        });
      });

      Object.values(subs).forEach((s) => {
        if (!processedIds.has(s.contestantId)) {
          processedIds.add(s.contestantId);
          submissionsList.push({
            ...s,
            answer: stripEmojis(s.answer || ''),
          });
        }
      });

      if (submissionsList.length === 0) {
        submissionsList.push({
          contestantId: 'solo_host',
          contestantName: 'المتسابق الأول',
          answer: '',
          submittedAt: Date.now(),
        });
      }

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
  // Sequenced Spotlight Camera Progression -> Global Zoom-Out
  // -------------------------------------------------------------
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
    } else if (flyingState.cameraMode === 'global_overview') {
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

  // -------------------------------------------------------------
  // Realtime Socket Event Listeners
  // -------------------------------------------------------------
  useEffect(() => {
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
        answer: stripEmojis((payload.answer || '').trim()),
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
  }, [
    roomCode,
    mergedContestants.length,
    executeEvaluation,
    handleStartGame,
    handleReturnToLobby,
    startQuestionRound,
    syncState,
  ]);

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
  // 2. Podium Phase (Clean Flat Brutalist Design, Zero Emojis)
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
        className="min-h-screen w-full bg-[#090D16] text-white flex flex-col items-center justify-between p-6 sm:p-10 select-none overflow-hidden"
      >
        <header className="flex flex-col items-center text-center gap-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-amber-400 text-black border-2 border-black font-sans text-sm font-black">
            <Trophy className="w-4 h-4 text-black" />
            <span>النتائج النهائية للارتفاع</span>
          </div>
          <h1 className="font-sans font-black text-4xl sm:text-5xl text-white mt-1">
            أبطال الشبح الطائر
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base font-bold">
            الترتيب النهائي بعد 5 جولات من الأجوبة النادرة
          </p>
        </header>

        {/* Flat 3-Tier Podium */}
        <div className="w-full max-w-4xl flex items-end justify-center gap-4 sm:gap-6 my-auto pt-10 pb-6">
          {/* Second Place */}
          {second && (
            <div className="flex-1 flex flex-col items-center">
              <GhostAvatar
                name={second.name}
                colorIndex={1}
                totalMeters={second.totalMeters}
                size="md"
              />
              <div className="w-full h-36 sm:h-44 rounded-t-2xl bg-zinc-800 border-2 border-black flex items-center justify-center text-white font-black text-4xl mt-3">
                2
              </div>
            </div>
          )}

          {/* First Place */}
          {first && (
            <div className="flex-1 flex flex-col items-center z-20">
              <GhostAvatar
                name={first.name}
                colorIndex={0}
                totalMeters={first.totalMeters}
                size="lg"
              />
              <div className="w-full h-48 sm:h-60 rounded-t-2xl bg-amber-400 border-2 border-black flex items-center justify-center text-black font-black text-5xl mt-3">
                1
              </div>
            </div>
          )}

          {/* Third Place */}
          {third && (
            <div className="flex-1 flex flex-col items-center">
              <GhostAvatar
                name={third.name}
                colorIndex={2}
                totalMeters={third.totalMeters}
                size="md"
              />
              <div className="w-full h-28 sm:h-36 rounded-t-2xl bg-orange-600 border-2 border-black flex items-center justify-center text-white font-black text-4xl mt-3">
                3
              </div>
            </div>
          )}
        </div>

        <footer className="flex items-center justify-center gap-4 w-full max-w-md">
          <button
            type="button"
            onClick={handleStartGame}
            className="flex-1 py-4 px-6 rounded-xl font-black text-base text-black bg-white hover:bg-zinc-200 border-2 border-black active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>جولة جديدة</span>
          </button>
          <button
            type="button"
            onClick={handleReturnToLobby}
            className="py-4 px-6 rounded-xl font-black text-base text-white bg-zinc-900 hover:bg-zinc-800 border-2 border-zinc-700 active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowRight className="w-5 h-5" />
            <span>العودة للوبي</span>
          </button>
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. Question & Calculating Phase (Clean Flat Style, No Hints, Zero Emojis)
  // -------------------------------------------------------------
  const q = flyingState.currentQuestion;
  const contestantsList =
    mergedContestants.length > 0
      ? mergedContestants
      : Object.keys(flyingState.submissions).length > 0
      ? Object.keys(flyingState.submissions).map((id) => ({
          id,
          name: flyingState.submissions[id]?.contestantName || 'متسابق',
        }))
      : Object.keys(flyingState.results).map((id) => ({
          id,
          name: flyingState.results[id]?.contestantName || 'متسابق',
        }));

  const submittedCount = Object.keys(flyingState.submissions).length;
  const totalContestants = Math.max(1, contestantsList.length);

  if (flyingState.phase === 'QUESTION' || flyingState.phase === 'CALCULATING') {
    return (
      <div
        dir="rtl"
        className="min-h-screen w-full bg-[#090D16] text-white flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden"
      >
        {/* Top Bar */}
        <header className="w-full max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-white text-black border-2 border-black font-sans font-black text-sm">
              السؤال {flyingState.roundNumber} من {flyingState.totalRounds}
            </div>
            <h2 className="font-sans font-black text-xl text-white">الشبح الطائر</h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer Badge */}
            <div
              className={`px-5 py-2 rounded-xl border-2 font-mono font-black text-2xl ${
                flyingState.timerSeconds <= 5
                  ? 'bg-[#EF4444] border-black text-white'
                  : 'bg-zinc-900 border-zinc-700 text-white'
              }`}
            >
              <span>{flyingState.timerSeconds} ثانية</span>
            </div>

            {/* Mute Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !isMuted;
                sound.setMuted(next);
                setIsMuted(next);
              }}
              className="p-3 rounded-xl bg-zinc-900 border-2 border-zinc-700 text-zinc-300 hover:text-white cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Center Question Card (Strictly Question Only, No Hints) */}
        <main className="w-full max-w-4xl mx-auto flex flex-col items-center text-center my-auto">
          {flyingState.phase === 'QUESTION' ? (
            <div className="w-full bg-white text-black border-4 border-black rounded-3xl p-8 sm:p-12 flex flex-col items-center">
              <span className="px-4 py-1 rounded-lg bg-zinc-900 text-white font-sans font-black text-xs sm:text-sm mb-5">
                {q.category}
              </span>

              <h1 className="font-sans font-black text-3xl sm:text-5xl text-black leading-tight mb-8">
                {q.title}
              </h1>

              {/* Submissions Counter */}
              <div className="w-full max-w-md flex flex-col items-center gap-3">
                <div className="w-full flex items-center justify-between text-xs font-sans font-black text-zinc-700 px-1">
                  <span>المتسابقون الجاهزون:</span>
                  <span>
                    {submittedCount} / {totalContestants}
                  </span>
                </div>
                <div className="w-full h-4 rounded-lg bg-zinc-200 overflow-hidden border-2 border-black">
                  <div
                    className="h-full bg-[#10B981] transition-all duration-300"
                    style={{ width: `${(submittedCount / totalContestants) * 100}%` }}
                  />
                </div>

                {/* Quick input on TV if solo testing */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const clean = stripEmojis(tvTestAnswer.trim());
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
                    placeholder="اكتب إجابة للتجربة من الشاشة..."
                    maxLength={60}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-100 border-2 border-black text-black font-sans font-bold text-sm focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="py-2.5 px-5 rounded-xl bg-black text-white font-black text-xs border-2 border-black cursor-pointer shrink-0"
                  >
                    إرسال
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => executeEvaluation()}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-sans font-black text-xs border-2 border-black transition-colors cursor-pointer"
                >
                  إنهاء الوقت وبدء الطيران
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full bg-white text-black border-4 border-black rounded-3xl p-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full border-4 border-zinc-300 border-t-black animate-spin mb-6" />
              <h2 className="font-sans font-black text-3xl text-black mb-2">
                جاري تقييم ندرة الإجابات وحساب الأمتار
              </h2>
              <p className="text-zinc-600 font-bold text-base">
                يتم الآن فحص الإجابات المتكررة وتحديد ارتفاع كل متسابق
              </p>
            </div>
          )}
        </main>

        {/* Bottom Contestants Status */}
        <footer className="w-full max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-2.5">
          {contestantsList.map((c, idx) => {
            const hasSub = Boolean(flyingState.submissions[c.id]);
            const playerColor = getGhostColor(idx);
            return (
              <div
                key={c.id}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 border-black text-xs font-black ${
                  hasSub ? 'bg-[#10B981] text-black' : 'bg-zinc-900 text-zinc-300'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full border border-black shrink-0"
                  style={{ backgroundColor: playerColor }}
                />
                <span className="truncate max-w-[120px]">{c.name}</span>
                {hasSub && <CheckCircle2 className="w-4 h-4 text-black" />}
              </div>
            );
          })}
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 4. Revealing Phase: Vertical City-to-Sky World & Camera Choreography
  // -------------------------------------------------------------
  return (
    <div
      dir="rtl"
      className="h-screen max-h-screen w-full bg-[#0F172A] text-white flex flex-col justify-between overflow-hidden relative select-none"
    >
      {/* Full Vertical World & Camera System */}
      <div className="absolute inset-0">
        <FlyingSkyWorld
          contestants={contestantsList}
          results={flyingState.results}
          cumulativeMeters={flyingState.cumulativeMeters}
          activeSpotlightIndex={flyingState.activeSpotlightIndex}
          cameraMode={flyingState.cameraMode}
        />
      </div>

      {/* Top Solid Header Bar */}
      <header className="relative z-30 w-full max-w-6xl mx-auto p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 bg-white text-black border-2 border-black rounded-xl px-4 py-2">
          <span className="px-2.5 py-0.5 rounded-md bg-black text-white font-sans font-black text-xs">
            الجولة {flyingState.roundNumber} من {flyingState.totalRounds}
          </span>
          <span className="font-sans font-black text-sm sm:text-base text-black truncate max-w-md">
            {flyingState.currentQuestion.title}
          </span>
        </div>

        {flyingState.cameraMode === 'global_overview' && (
          <div className="px-4 py-2 rounded-xl bg-amber-400 text-black border-2 border-black font-sans font-black text-xs sm:text-sm">
            {flyingState.roundNumber >= flyingState.totalRounds
              ? `الانتقال لمنصة التتويج خلال ${autoAdvanceSeconds} ثوان`
              : `السؤال التالي خلال ${autoAdvanceSeconds} ثوان`}
          </div>
        )}
      </header>

      {/* Bottom Leaderboard Bar during Global Zoom-Out */}
      {flyingState.cameraMode === 'global_overview' && (
        <footer className="relative z-30 w-full max-w-5xl mx-auto p-4 mb-2 flex flex-col items-center">
          <div className="w-full bg-white text-black border-2 border-black rounded-2xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-black text-black shrink-0">
              <Trophy className="w-4 h-4 text-black" />
              <span>ترتيب الارتفاع العام:</span>
            </div>

            <div className="flex-1 flex items-center gap-2 overflow-x-auto py-1">
              {getRankedFlyingContestants(
                flyingState.cumulativeMeters,
                mergedContestants,
                flyingState.results
              ).map((player, idx) => (
                <div
                  key={player.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 border-2 border-black text-xs shrink-0"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black"
                    style={{ backgroundColor: getGhostColor(idx) }}
                  />
                  <span className="font-mono font-black text-black">#{player.rank}</span>
                  <span className="font-black text-black truncate max-w-[95px]">
                    {player.name}
                  </span>
                  <span className="font-mono font-black text-white bg-black px-2 py-0.5 rounded">
                    {player.totalMeters} متر
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
              className="px-4 py-2 rounded-xl bg-black text-white border-2 border-black font-black text-xs shrink-0 active:scale-95 transition-transform cursor-pointer"
            >
              {flyingState.roundNumber >= flyingState.totalRounds ? 'عرض التتويج' : 'السؤال التالي'}
            </button>
          </div>
        </footer>
      )}
    </div>
  );
};
