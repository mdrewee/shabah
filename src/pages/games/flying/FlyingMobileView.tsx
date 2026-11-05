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
import { stripEmojis } from './flyingEngine';
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

  const mergedContestants =
    realtimeContestants.length > 0
      ? realtimeContestants
      : (activeRoom?.players || []).filter((p) => p.id !== 'host_tv');

  const handleStartGame = useCallback(() => {
    sound.playVictory();
    // Signal TV host to start game
    roomBus.safeBroadcast(roomCode, 'GAME_STARTED', { roomCode });
    roomBus.broadcast('GAME_STARTED', { roomCode });
  }, [roomCode]);

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
    setHasSubmittedThisRound(false);
    setAnswerInput('');
    setSubmittedAnswer('');
    roomBus.broadcastReturnToLobby(roomCode);
  }, [roomCode]);

  // -------------------------------------------------------------
  // Question Timer Countdown (Visual display only, evaluation is exclusive to TV Host)
  // -------------------------------------------------------------
  useEffect(() => {
    if (flyingState.phase !== 'QUESTION') return;

    const timer = setInterval(() => {
      setFlyingState((prev) => {
        if (prev.phase !== 'QUESTION') return prev;
        if (prev.timerSeconds <= 1) {
          clearInterval(timer);
          return { ...prev, timerSeconds: 0 };
        }
        const updated = { ...prev, timerSeconds: prev.timerSeconds - 1 };
        stateRef.current = updated;
        return updated;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [flyingState.phase]);

  // -------------------------------------------------------------
  // Realtime Socket Event Synchronizer
  // -------------------------------------------------------------
  useEffect(() => {
    // 1. Direct New Round Event (Single Source of Truth from TV Host)
    const unsubNewRound = roomBus.on('FLYING_NEW_ROUND', (evt: any) => {
      const incomingCode = evt?.roomCode;
      const payload = evt?.data ?? evt;
      if (incomingCode && incomingCode !== roomCode) return;
      if (!payload || !payload.question) return;

      sound.playClick();
      const nextRound = Number(payload.roundIndex) || 1;
      const nextTotal = Number(payload.totalRounds) || 5;
      const nextDuration = Number(payload.roundDuration) || ROUND_TIME;

      const newState: FlyingRoomState = {
        ...stateRef.current,
        phase: 'QUESTION',
        roundNumber: nextRound,
        totalRounds: nextTotal,
        currentQuestion: payload.question,
        timerSeconds: nextDuration,
        submissions: {},
        results: {},
        activeSpotlightIndex: 0,
        cameraMode: 'spotlight',
      };

      stateRef.current = newState;
      setFlyingState(newState);
      savePersistedFlyingState(roomCode, newState);

      setAnswerInput('');
      setSubmittedAnswer('');
      setHasSubmittedThisRound(false);
      setIsSubmitting(false);
    });

    // 2. AI Evaluation Notification from TV
    const unsubEvaluating = roomBus.on('FLYING_EVALUATING', (evt: any) => {
      const incomingCode = evt?.roomCode;
      if (incomingCode && incomingCode !== roomCode) return;
      setFlyingState((prev) => ({
        ...prev,
        phase: 'CALCULATING',
      }));
    });

    // 3. Results Ready from TV Host
    const handleResultsEvent = (evt: any) => {
      const incomingCode = evt?.roomCode;
      const payload = evt?.data ?? evt;
      if (incomingCode && incomingCode !== roomCode) return;
      if (!payload?.results) return;

      sound.playSuccess?.();
      const nextCumulative =
        payload.cumulativeMeters || stateRef.current.cumulativeMeters || {};

      const nextState: FlyingRoomState = {
        ...stateRef.current,
        phase: 'REVEALING',
        results: payload.results,
        cumulativeMeters: nextCumulative,
        activeSpotlightIndex: payload.activeSpotlightIndex ?? 0,
        cameraMode: payload.cameraMode ?? 'spotlight',
      };

      stateRef.current = nextState;
      setFlyingState(nextState);
      savePersistedFlyingState(roomCode, nextState);
    };

    const unsubRoundResults = roomBus.on('FLYING_ROUND_RESULTS', handleResultsEvent);
    const unsubResultsReady = roomBus.on('FLYING_RESULTS_READY', handleResultsEvent);

    // 4. Full State Sync from TV Host
    const unsubSync = roomBus.on('FLYING_STATE_SYNC', (evt: any) => {
      const incomingCode = evt?.roomCode;
      const payload: FlyingRoomState = evt?.data ?? evt;
      if (incomingCode && incomingCode !== roomCode) return;
      if (!payload) return;

      const prev = stateRef.current;
      const isNewRoundOrQuestion =
        payload.roundNumber !== prev.roundNumber ||
        payload.currentQuestion?.id !== prev.currentQuestion?.id ||
        (prev.phase !== 'QUESTION' && payload.phase === 'QUESTION');

      stateRef.current = payload;
      setFlyingState(payload);
      savePersistedFlyingState(roomCode, payload);

      if (payload.phase === 'QUESTION') {
        if (isNewRoundOrQuestion) {
          setHasSubmittedThisRound(false);
          setAnswerInput('');
          setSubmittedAnswer('');
          setIsSubmitting(false);
        } else {
          const mySub = payload.submissions?.[playerId];
          if (mySub) {
            setHasSubmittedThisRound(true);
            setSubmittedAnswer(mySub.answer);
          }
        }
      } else if (payload.phase === 'PODIUM') {
        setHasSubmittedThisRound(false);
        setAnswerInput('');
      }
    });

    // 5. Game Over / Final Podium Event
    const unsubGameOver = roomBus.on('FLYING_GAME_OVER', (evt: any) => {
      const incomingCode = evt?.roomCode;
      const payload = evt?.data ?? evt;
      if (incomingCode && incomingCode !== roomCode) return;
      sound.playVictory();
      setFlyingState((prev) => ({
        ...prev,
        phase: 'PODIUM',
        cumulativeMeters: payload?.cumulativeMeters || prev.cumulativeMeters,
      }));
    });

    // 6. Return to Lobby Event
    const unsubReturn = roomBus.on('RETURN_TO_LOBBY', (evt: any) => {
      const incomingCode = evt?.roomCode;
      if (incomingCode && incomingCode !== roomCode) return;
      const lobbyState: FlyingRoomState = {
        ...createInitialFlyingState(roomCode),
        phase: 'LOBBY',
        cumulativeMeters: {},
        submissions: {},
        results: {},
      };
      stateRef.current = lobbyState;
      setFlyingState(lobbyState);
      setHasSubmittedThisRound(false);
      setAnswerInput('');
      setSubmittedAnswer('');
    });

    return () => {
      unsubNewRound?.();
      unsubEvaluating?.();
      unsubRoundResults?.();
      unsubResultsReady?.();
      unsubSync?.();
      unsubGameOver?.();
      unsubReturn?.();
    };
  }, [roomCode, playerId]);

  // -------------------------------------------------------------
  // Submit Answer (Pure socket broadcast, no local AI evaluation)
  // -------------------------------------------------------------
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

    // Broadcast across socket channels for arrival at TV Host
    roomBus.broadcast('FLYING_SUBMIT_ANSWER', submitPayload);
    roomBus.safeBroadcast(roomCode, 'FLYING_SUBMIT_ANSWER', submitPayload);
    roomBus.emit('FLYING_SUBMIT_ANSWER', roomCode, submitPayload);
    if ((roomBus as any).broadcastFlyingAnswer) {
      (roomBus as any).broadcastFlyingAnswer(roomCode, submitPayload);
    }

    setFlyingState((prev) => ({
      ...prev,
      submissions: {
        ...prev.submissions,
        [playerId]: mySubmission,
      },
    }));

    setTimeout(() => {
      setIsSubmitting(false);
    }, 300);
  };

  const myResult: FlyingContestantResult | undefined = flyingState.results[playerId];
  const myTotalMeters = flyingState.cumulativeMeters[playerId] || 0;
  const q = flyingState.currentQuestion;

  // -------------------------------------------------------------
  // 1. Lobby Phase
  // -------------------------------------------------------------
  if (flyingState.phase === 'LOBBY') {
    return (
      <div dir="rtl" className="min-h-screen w-full bg-[#030712] select-none overflow-hidden pixel-art">
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
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. Podium Phase (16-Bit Retro Pixel Arcade)
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
        className="min-h-screen min-h-[100dvh] w-full bg-[#070B14] text-white flex flex-col justify-between p-5 select-none overflow-hidden pixel-art font-sans"
      >
        <header className="flex flex-col items-center text-center gap-2 pt-2">
          <div className="pixel-box bg-amber-400 text-black border-2 border-black px-3.5 py-1 font-mono text-xs font-black tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4 text-black" />
            <span>النتائج النهائية</span>
          </div>
          <h1 className="font-mono font-black text-2xl sm:text-3xl text-white tracking-wide">
            أبطال الشبح الطائر
          </h1>
          <p className="text-zinc-400 text-xs font-mono">
            الترتيب النهائي بعد {flyingState.totalRounds} جولات
          </p>
        </header>

        {/* 16-Bit Stepped Pixel Podium */}
        <div className="w-full max-w-sm mx-auto flex items-end justify-center gap-3 my-auto pt-6 pb-4">
          {second && (
            <div className="flex-1 flex flex-col items-center">
              <GhostAvatar
                name={second.name}
                colorIndex={1}
                totalMeters={second.totalMeters}
                size="sm"
              />
              <div className="w-full h-24 bg-zinc-700 border-4 border-black flex flex-col items-center justify-center text-white font-mono font-black mt-2 shadow-[4px_4px_0px_#000]">
                <span className="text-2xl">2</span>
                <span className="text-[10px] text-zinc-300">{second.totalMeters}م</span>
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
              <div className="w-full h-36 bg-amber-400 border-4 border-black flex flex-col items-center justify-center text-black font-mono font-black mt-2 shadow-[4px_4px_0px_#000]">
                <span className="text-3xl">1</span>
                <span className="text-xs text-black font-bold">{first.totalMeters}م</span>
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
              <div className="w-full h-18 bg-amber-700 border-4 border-black flex flex-col items-center justify-center text-white font-mono font-black mt-2 shadow-[4px_4px_0px_#000]">
                <span className="text-2xl">3</span>
                <span className="text-[10px] text-amber-200">{third.totalMeters}م</span>
              </div>
            </div>
          )}
        </div>

        <footer className="flex items-center justify-center gap-3 w-full max-w-sm mx-auto">
          {isPlayerHost && (
            <button
              type="button"
              onClick={handleStartGame}
              className="flex-1 py-3 px-4 font-mono font-black text-xs uppercase tracking-wider text-black bg-amber-400 border-4 border-black shadow-[4px_4px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-none flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>جولة جديدة</span>
            </button>
          )}
          <button
            type="button"
            onClick={isPlayerHost ? handleReturnToLobby : () => navigate('/')}
            className="flex-1 py-3 px-4 bg-[#111827] border-4 border-black shadow-[4px_4px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-none font-mono font-black text-xs uppercase tracking-wider text-white flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>{isPlayerHost ? 'العودة للوبي' : 'خروج للرئيسية'}</span>
          </button>
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. Question Answering Phase (16-Bit Pixel Aesthetic)
  // -------------------------------------------------------------
  if (flyingState.phase === 'QUESTION' || flyingState.phase === 'CALCULATING') {
    return (
      <div
        dir="rtl"
        className="min-h-screen min-h-[100dvh] w-full bg-[#070B14] text-white flex flex-col justify-between p-4 select-none overflow-hidden pixel-art font-sans"
      >
        {/* Top Header */}
        <header className="w-full max-w-md mx-auto flex items-center justify-between">
          <div className="pixel-box bg-[#151D2A] text-amber-400 px-3.5 py-1.5 font-mono text-xs font-black tracking-wider border-2 border-black">
            الجولة {flyingState.roundNumber} / {flyingState.totalRounds}
          </div>

          <div className="pixel-box bg-black text-emerald-400 px-3.5 py-1.5 font-mono text-xs font-black tracking-wider border-2 border-black">
            الارتفاع: {myTotalMeters}م
          </div>
        </header>

        {/* Main Content Card */}
        <main className="w-full max-w-md mx-auto flex flex-col my-auto py-2">
          {flyingState.phase === 'CALCULATING' ? (
            <div className="pixel-box bg-[#111827] text-white border-4 border-black p-6 sm:p-8 flex flex-col items-center text-center">
              <div className="w-12 h-12 border-4 border-amber-400 border-t-black animate-spin mb-5" />
              <div className="inline-block px-3 py-1 bg-amber-400 text-black font-mono font-black text-xs tracking-wider mb-3 border-2 border-black">
                جاري التحكيم الذكي
              </div>
              <h2 className="font-mono font-black text-lg sm:text-xl text-white mb-2">
                فحص ندرة الإجابات بالأمتار
              </h2>
              <p className="text-zinc-400 font-mono text-xs leading-relaxed">
                يتم الآن رصد الإجابات المتطابقة وتحديد ارتفاع الأشباح في سماء الرياض
              </p>
            </div>
          ) : (
            <div className="pixel-box bg-[#111827] text-white border-4 border-black p-5 sm:p-6 flex flex-col items-center text-center">
              <span className="px-3 py-1 bg-amber-400 text-black border-2 border-black font-mono text-xs font-black uppercase tracking-wider mb-4">
                {q.category}
              </span>

              <h2 className="font-mono font-black text-lg sm:text-xl text-white leading-relaxed mb-6">
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
                    className="w-full py-3.5 px-4 bg-[#070B14] border-4 border-black text-amber-300 font-mono font-black text-center text-base placeholder:text-zinc-600 focus:outline-none focus:border-amber-400"
                    autoFocus
                  />

                  <button
                    type="submit"
                    disabled={!answerInput.trim() || isSubmitting}
                    className={`w-full py-3.5 font-mono font-black text-sm uppercase tracking-wider border-4 border-black transition-none cursor-pointer ${
                      answerInput.trim() && !isSubmitting
                        ? 'bg-amber-400 text-black shadow-[4px_4px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none'
                        : 'bg-zinc-800 text-zinc-600 border-zinc-950 cursor-not-allowed shadow-none'
                    }`}
                  >
                    إرسال الإجابة
                  </button>
                </form>
              ) : (
                <div className="w-full py-4 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-400 border-4 border-black flex items-center justify-center text-black">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>

                  <div>
                    <h3 className="font-mono font-black text-base text-emerald-400 mb-1">
                      تم اعتماد إجابتك
                    </h3>
                    <p className="text-xs font-mono text-zinc-400">
                      بانتظار انتهاء الوقت وحساب النتيجة من شاشة التلفزيون
                    </p>
                  </div>

                  <div className="px-4 py-2 bg-[#070B14] border-2 border-black text-white font-mono font-bold text-sm mt-1 max-w-full truncate">
                    "{submittedAnswer}"
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Footer Countdown */}
        <footer className="w-full flex items-center justify-center pb-2">
          <div className="pixel-box bg-[#111827] text-white px-4 py-2 border-2 border-black flex items-center gap-2 font-mono text-xs font-black">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>الوقت المتبقي: {flyingState.timerSeconds} ثانية</span>
          </div>
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 4. Revealing Phase: 16-Bit Pixel Sky World + Summary Card
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
      className="h-screen max-h-screen w-full bg-[#070B14] text-white flex flex-col justify-between overflow-hidden relative select-none pixel-art"
    >
      {/* 16-Bit Vertical Skyline World & Ghost Sprites */}
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
      <header className="relative z-30 w-full max-w-md mx-auto p-3 flex items-center justify-between">
        <div className="pixel-box bg-[#111827] text-amber-400 px-3 py-1.5 border-2 border-black font-mono text-xs font-black">
          الجولة {flyingState.roundNumber} / {flyingState.totalRounds}
        </div>
        <div className="pixel-box bg-black text-emerald-400 px-3 py-1.5 border-2 border-black font-mono text-xs font-black">
          الارتفاع الكلي: {myTotalMeters}م
        </div>
      </header>

      {/* Bottom Personal Summary Card */}
      <footer className="relative z-30 w-full max-w-md mx-auto p-3">
        {myResult && (
          <div className="pixel-box bg-[#111827] text-white border-4 border-black p-3.5 flex items-center justify-between gap-3 shadow-[4px_4px_0px_#000]">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="shrink-0">
                <span
                  className="px-2.5 py-1 border-2 border-black font-mono font-black text-xs inline-block"
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
                  <span className="font-mono font-black text-sm text-white truncate">
                    "{myResult.answer || 'بدون إجابة'}"
                  </span>
                  <span className="font-mono text-xs font-black text-black bg-amber-400 px-2 py-0.5 border border-black shrink-0">
                    +{myResult.roundMeters}م
                  </span>
                </div>
                <p className="text-[11px] font-mono text-zinc-400 truncate">
                  {myResult.comment}
                </p>
              </div>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
};
