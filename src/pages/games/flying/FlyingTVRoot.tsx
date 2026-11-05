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
      roomBus.broadcast('FLYING_STATE_SYNC', newState);
    },
    [roomCode]
  );

  // -------------------------------------------------------------
  // Round Flow Handlers (Single Source of Truth from TV Host)
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
        totalRounds: 5,
        currentQuestion: question,
        usedQuestionIds: nextUsed,
        timerSeconds: ROUND_TIME,
        roundStartedAt: Date.now(),
        submissions: {},
        results: {},
        activeSpotlightIndex: 0,
        cameraMode: 'global_overview',
        readyPlayersNextRound: [],
      };

      syncState(nextState);

      // Centralized Broadcast: TV dictates the new question to all mobiles
      const roundPayload = {
        roundIndex: roundNum,
        totalRounds: 5,
        question,
        roundDuration: ROUND_TIME,
        roomCode,
      };

      roomBus.safeBroadcast(roomCode, 'FLYING_NEW_ROUND', roundPayload);
      roomBus.broadcast('FLYING_NEW_ROUND', roundPayload);
    },
    [roomCode, syncState]
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
    stateRef.current = lobbyState;
    setFlyingState(lobbyState);
    savePersistedFlyingState(roomCode, lobbyState);
    roomBus.broadcastReturnToLobby(roomCode);
  }, [roomCode]);

  // Exclusive AI Evaluation (Runs solely on TV Host)
  const executeEvaluation = useCallback(async () => {
    const curr = stateRef.current;
    if (curr.phase === 'CALCULATING' || curr.phase === 'REVEALING') return;

    sound.playTick();
    const subs = curr.submissions || {};
    const calcState: FlyingRoomState = {
      ...curr,
      phase: 'CALCULATING',
      submissions: subs,
    };
    stateRef.current = calcState;
    syncState(calcState);

    const submissionsList: FlyingSubmission[] = [];
    const processedIds = new Set<string>();

    // 1. Gather all connected contestants with resilient lookup
    mergedContestants.forEach((c) => {
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

    // 2. Safety net: include any submissions received not in mergedContestants
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

    const resultsPayload = {
      results: resultMap,
      cumulativeMeters: nextCumulative,
      roundNumber: curr.roundNumber,
      roomCode,
    };
    roomBus.safeBroadcast(roomCode, 'FLYING_ROUND_RESULTS', resultsPayload);
    roomBus.broadcast('FLYING_ROUND_RESULTS', resultsPayload);
    roomBus.safeBroadcast(roomCode, 'FLYING_RESULTS_READY', resultsPayload);
    roomBus.broadcast('FLYING_RESULTS_READY', resultsPayload);
  }, [mergedContestants, roomCode, syncState]);

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
          setAutoAdvanceSeconds(5);
        }
      }, 3400);

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
              roomBus.safeBroadcast(roomCode, 'FLYING_GAME_OVER', {
                cumulativeMeters: stateRef.current.cumulativeMeters,
                roomCode,
              });
              roomBus.broadcast('FLYING_GAME_OVER', {
                cumulativeMeters: stateRef.current.cumulativeMeters,
                roomCode,
              });
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
    roomCode,
  ]);

  // -------------------------------------------------------------
  // Realtime Socket Event Listeners
  // -------------------------------------------------------------
  useEffect(() => {
    const unsubAnswer = roomBus.on('FLYING_SUBMIT_ANSWER', (evt: any) => {
      const incomingCode = evt?.roomCode;
      const payload = evt?.data ?? evt;
      if (incomingCode && incomingCode !== roomCode) return;
      if (!payload) return;

      const contestantId = String(payload.contestantId || payload.playerId || payload.id || '');
      if (!contestantId) return;

      const contestantName = String(
        payload.contestantName || payload.playerName || payload.name || 'متسابق'
      );
      const rawAnswer =
        payload.answer !== undefined
          ? payload.answer
          : payload.text !== undefined
          ? payload.text
          : payload.rawAnswer;
      const answer = stripEmojis(String(rawAnswer || '').trim());

      const curr = stateRef.current;
      if (curr.phase !== 'QUESTION') return;

      sound.playClick();
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
      roomBus.safeBroadcast(roomCode, 'FLYING_STATE_SYNC', updatedState);
      roomBus.broadcast('FLYING_STATE_SYNC', updatedState);
    });

    let isStartingGame = false;
    const unsubGameStarted = roomBus.on('GAME_STARTED', (evt: any) => {
      const incomingCode = evt?.roomCode;
      if (incomingCode && incomingCode !== roomCode) return;
      if (isStartingGame) return;
      if (stateRef.current.phase === 'LOBBY') {
        isStartingGame = true;
        handleStartGame();
        setTimeout(() => {
          isStartingGame = false;
        }, 1500);
      }
    });

    const unsubLobby = roomBus.on('RETURN_TO_LOBBY', (evt: any) => {
      const incomingCode = evt?.roomCode;
      if (incomingCode && incomingCode !== roomCode) return;
      clearPersistedFlyingState(roomCode);
      const lobbyState = createInitialFlyingState(roomCode);
      stateRef.current = lobbyState;
      setFlyingState(lobbyState);
    });

    return () => {
      unsubAnswer();
      unsubGameStarted();
      unsubLobby();
    };
  }, [roomCode, handleStartGame]);

  // Contestant list resolution
  const contestantsList =
    mergedContestants.length > 0
      ? mergedContestants
      : Object.keys(flyingState.submissions).length > 0
      ? Object.keys(flyingState.submissions).map((id) => ({
          id,
          name: flyingState.submissions[id]?.contestantName || 'متسابق',
        }))
      : Object.keys(flyingState.results).length > 0
      ? Object.keys(flyingState.results).map((id) => ({
          id,
          name: flyingState.results[id]?.contestantName || 'متسابق',
        }))
      : [{ id: 'player_1', name: 'المتسابق الأول' }];

  const submittedCount = Object.keys(flyingState.submissions).length;
  const totalContestants = Math.max(1, contestantsList.length);
  const q = flyingState.currentQuestion;

  // -------------------------------------------------------------
  // 1. Lobby Phase
  // -------------------------------------------------------------
  if (flyingState.phase === 'LOBBY') {
    return (
      <div dir="rtl" className="h-screen w-full bg-[#030712] select-none overflow-hidden pixel-art">
        <UnifiedShabahLobby
          gameId="flying"
          roomCode={roomCode}
          isHost={true}
          isTv={true}
          onStartGame={handleStartGame}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. Final Podium Phase: 16-Bit Pixel Arcade Podium
  // -------------------------------------------------------------
  if (flyingState.phase === 'PODIUM') {
    const ranked = getRankedFlyingContestants(
      flyingState.cumulativeMeters,
      mergedContestants,
      flyingState.results
    );
    const [first, second, third] = ranked;

    return (
      <div
        dir="rtl"
        className="h-screen w-full bg-[#030712] text-white flex flex-col justify-between items-center p-6 sm:p-10 select-none overflow-hidden pixel-art"
      >
        <header className="flex flex-col items-center text-center mt-4">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-400 text-black border-4 border-black font-mono font-black text-xs sm:text-sm shadow-[4px_4px_0px_#000]">
            <Trophy className="w-4 h-4 text-black" />
            <span>النتائج النهائية للارتفاع</span>
          </div>
          <h1 className="font-mono font-black text-4xl sm:text-5xl text-white mt-3 tracking-wide">
            أبطال الشبح الطائر
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm font-mono mt-1">
            الترتيب النهائي بعد 5 جولات من الأجوبة النادرة
          </p>
        </header>

        {/* 16-Bit Stepped Arcade Podium */}
        <div className="w-full max-w-4xl flex items-end justify-center gap-4 sm:gap-6 my-auto pt-10 pb-6">
          {second && (
            <div className="flex-1 flex flex-col items-center">
              <GhostAvatar
                name={second.name}
                colorIndex={1}
                totalMeters={second.totalMeters}
                size="md"
              />
              <div className="w-full h-36 sm:h-44 bg-zinc-800 border-4 border-black shadow-[4px_4px_0px_#000] flex flex-col items-center justify-center text-white font-mono font-black text-4xl mt-3">
                <span>2</span>
                <span className="text-xs text-zinc-400">{second.totalMeters} م</span>
              </div>
            </div>
          )}

          {first && (
            <div className="flex-1 flex flex-col items-center z-20">
              <GhostAvatar
                name={first.name}
                colorIndex={0}
                totalMeters={first.totalMeters}
                size="lg"
              />
              <div className="w-full h-48 sm:h-60 bg-amber-400 border-4 border-black shadow-[6px_6px_0px_#000] flex flex-col items-center justify-center text-black font-mono font-black text-5xl mt-3">
                <span>1</span>
                <span className="text-sm font-black">{first.totalMeters} م</span>
              </div>
            </div>
          )}

          {third && (
            <div className="flex-1 flex flex-col items-center">
              <GhostAvatar
                name={third.name}
                colorIndex={2}
                totalMeters={third.totalMeters}
                size="md"
              />
              <div className="w-full h-28 sm:h-36 bg-orange-600 border-4 border-black shadow-[4px_4px_0px_#000] flex flex-col items-center justify-center text-white font-mono font-black text-4xl mt-3">
                <span>3</span>
                <span className="text-xs text-zinc-200">{third.totalMeters} م</span>
              </div>
            </div>
          )}
        </div>

        <footer className="flex items-center justify-center gap-4 w-full max-w-md mb-4">
          <button
            type="button"
            onClick={handleStartGame}
            className="flex-1 py-4 px-6 font-mono font-black text-base text-black bg-white hover:bg-zinc-200 border-4 border-black shadow-[4px_4px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-transform flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>جولة جديدة</span>
          </button>
          <button
            type="button"
            onClick={handleReturnToLobby}
            className="py-4 px-6 font-mono font-black text-base text-white bg-zinc-900 hover:bg-zinc-800 border-4 border-black shadow-[4px_4px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-transform flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowRight className="w-5 h-5" />
            <span>العودة للوبي</span>
          </button>
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. Question, Calculating & Revealing: Continuous Vertical Pixel World
  // -------------------------------------------------------------
  const isQuestionPhase = flyingState.phase === 'QUESTION';
  const isCalculatingPhase = flyingState.phase === 'CALCULATING';
  const isRevealingPhase = flyingState.phase === 'REVEALING';

  return (
    <div
      dir="rtl"
      className="h-screen max-h-screen w-full bg-[#030712] text-white flex flex-col justify-between overflow-hidden relative select-none pixel-art"
    >
      {/* Background Vertical Pixel-Art Skyline World */}
      <div className="absolute inset-0">
        <FlyingSkyWorld
          contestants={contestantsList}
          results={isRevealingPhase ? flyingState.results : {}}
          cumulativeMeters={flyingState.cumulativeMeters}
          activeSpotlightIndex={
            isRevealingPhase ? flyingState.activeSpotlightIndex : 0
          }
          cameraMode={isRevealingPhase ? flyingState.cameraMode : 'global_overview'}
        />
      </div>

      {/* =========================================================
          TOP PIXEL-BOX HEADER CARD: Crisp 16-Bit Arcade Overlay
          ========================================================= */}
      <header className="relative z-30 w-full max-w-5xl mx-auto p-4 sm:p-6">
        <div className="w-full bg-[#0B0F17] border-4 border-black shadow-[6px_6px_0px_#000] p-4 sm:p-5 flex flex-col gap-3">
          {/* Top Bar: Round Badge, Category, Timer, Audio */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 bg-white text-black border-2 border-black font-mono font-black text-xs sm:text-sm shadow-[2px_2px_0px_#000]">
                السؤال {flyingState.roundNumber} من {flyingState.totalRounds}
              </span>
              <span className="px-3 py-1 bg-zinc-800 text-amber-300 border-2 border-black font-mono font-black text-xs shadow-[2px_2px_0px_#000]">
                {q.category}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {isQuestionPhase && (
                <div
                  className={`px-4 py-1.5 border-4 border-black font-mono font-black text-lg sm:text-xl shadow-[4px_4px_0px_#000] ${
                    flyingState.timerSeconds <= 5
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-zinc-900 text-white'
                  }`}
                >
                  <span>{flyingState.timerSeconds} ثانية</span>
                </div>
              )}

              {isCalculatingPhase && (
                <div className="px-4 py-1.5 bg-amber-400 text-black border-4 border-black font-mono font-black text-xs sm:text-sm shadow-[4px_4px_0px_#000] flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent animate-spin" />
                  <span>تقييم الإجابات</span>
                </div>
              )}

              {isRevealingPhase && flyingState.cameraMode === 'global_overview' && (
                <div className="px-4 py-1.5 bg-amber-400 text-black border-4 border-black font-mono font-black text-xs sm:text-sm shadow-[4px_4px_0px_#000]">
                  {flyingState.roundNumber >= flyingState.totalRounds
                    ? `منصة التتويج خلال ${autoAdvanceSeconds} ثوان`
                    : `السؤال التالي خلال ${autoAdvanceSeconds} ثوان`}
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  const next = !isMuted;
                  sound.setMuted(next);
                  setIsMuted(next);
                }}
                className="p-2.5 bg-zinc-900 border-2 border-black shadow-[2px_2px_0px_#000] text-zinc-300 hover:text-white cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                title="كتم أو تفعيل الصوت"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Question Text in Prominent 16-Bit Font */}
          <div className="text-center py-1">
            <h1 className="font-mono font-black text-xl sm:text-3xl text-white leading-snug tracking-wide">
              {q.title}
            </h1>
          </div>

          {/* Submissions Status & Early Proceed Button during QUESTION phase */}
          {isQuestionPhase && (
            <div className="flex items-center justify-between pt-2 border-t-2 border-zinc-800 text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-2">
                <span>المتسابقون الجاهزون:</span>
                <span className="text-white font-black bg-zinc-800 px-2 py-0.5 border border-zinc-700 shadow-[1px_1px_0px_#000]">
                  {submittedCount} / {totalContestants}
                </span>
              </div>

              <button
                type="button"
                onClick={() => executeEvaluation()}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-mono font-black text-xs border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-transform cursor-pointer"
              >
                إنهاء الوقت وبدء التحليق
              </button>
            </div>
          )}

          {/* Evaluation Progress Indicator during CALCULATING phase */}
          {isCalculatingPhase && (
            <div className="text-center py-1 text-xs text-zinc-400 font-mono font-bold">
              يتم الآن كشف الإجابات المكررة وتقييم ندرة الأجوبة الصحيحة...
            </div>
          )}
        </div>
      </header>

      {/* =========================================================
          BOTTOM PIXEL-BOX LEADERBOARD OR CONTESTANT STATUS
          ========================================================= */}
      {isRevealingPhase && flyingState.cameraMode === 'global_overview' ? (
        <footer className="relative z-30 w-full max-w-5xl mx-auto p-4 mb-2 flex flex-col items-center">
          <div className="w-full bg-[#0B0F17] border-4 border-black shadow-[6px_6px_0px_#000] p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-mono font-black text-amber-400 shrink-0">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>ترتيب الارتفاع:</span>
            </div>

            <div className="flex-1 flex items-center gap-2 overflow-x-auto py-1">
              {getRankedFlyingContestants(
                flyingState.cumulativeMeters,
                mergedContestants,
                flyingState.results
              ).map((player, idx) => (
                <div
                  key={player.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border-2 border-black text-xs shrink-0 shadow-[2px_2px_0px_#000]"
                >
                  <span
                    className="w-2.5 h-2.5 border border-black shrink-0"
                    style={{ backgroundColor: getGhostColor(idx) }}
                  />
                  <span className="font-mono font-black text-zinc-400">#{player.rank}</span>
                  <span className="font-mono font-black text-white truncate max-w-[95px]">
                    {player.name}
                  </span>
                  <span className="font-mono font-black text-black bg-amber-400 px-2 py-0.5 border border-black">
                    {player.totalMeters} م
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
              className="px-4 py-2 bg-white text-black border-4 border-black shadow-[4px_4px_0px_#000] font-mono font-black text-xs shrink-0 hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-transform cursor-pointer"
            >
              {flyingState.roundNumber >= flyingState.totalRounds ? 'عرض التتويج' : 'السؤال التالي'}
            </button>
          </div>
        </footer>
      ) : (
        <footer className="relative z-30 w-full max-w-5xl mx-auto p-4 mb-2 flex flex-wrap items-center justify-center gap-2">
          {contestantsList.map((c, idx) => {
            const hasSub = Boolean(flyingState.submissions[c.id]);
            const playerColor = getGhostColor(idx);
            return (
              <div
                key={c.id}
                className={`flex items-center gap-2 px-3 py-1.5 border-2 border-black font-mono text-xs font-black shadow-[2px_2px_0px_#000] transition-colors ${
                  hasSub
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#0B0F17] text-zinc-300'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 border border-black shrink-0"
                  style={{ backgroundColor: playerColor }}
                />
                <span className="truncate max-w-[120px]">{c.name}</span>
                {hasSub && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </div>
            );
          })}
        </footer>
      )}
    </div>
  );
};
