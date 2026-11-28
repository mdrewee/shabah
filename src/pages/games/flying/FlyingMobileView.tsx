import {WaitingChase} from '../../../components/common/WaitingChase';
import { ShabahThinkingScreen } from '../../../components/common/ShabahThinkingScreen';
import { getSeenFlyingQuestions, rememberFlyingQuestion } from './flyingQuestionHistory';
import { FlyingBankExhausted } from './FlyingBankExhausted';
import { isRoomHost } from '../../../services/roomService';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from './types';
import {
  createInitialFlyingState,
  getPersistedFlyingState,
  savePersistedFlyingState,
  getRankedFlyingContestants,
} from './flyingSync';
import { stripEmojis } from './flyingEngine';
import { FlyingSkyWorld } from './FlyingSkyWorld';
import { FlyingTVRoot } from './FlyingTVRoot';
import { GhostAvatar } from './GhostAvatar';
import { flyingRevealRoster, FLYING_QUESTION_SECONDS } from './flyingRound';
import { useSafeCountdown } from '../../../hooks/useSafeCountdown';
import {
  CheckCircle2,
  Clock,
  Trophy,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';

const ROUND_TIME = FLYING_QUESTION_SECONDS;

export const FlyingMobileView: React.FC = () => {
  const { code } = useParams<{ code?: string }>();
  const roomCode = (code || 'SHBH').trim().toUpperCase();
  const isPlayerHost = isRoomHost(roomCode);

  const [playerId] = useState<string>(() => getOrCreatePlayerId());
  const [playerName] = useState<string>(() => {
    return getPersistedPlayerName() || getOrCreatePlayerName('متسابق');
  });

  const { connectedPlayers: realtimeContestants, hasPresenceSnapshot } = useRoomSync({
    roomCode,
    role: 'contestant',
    playerId,
    playerName,
  });

  const { room } = useRoom(roomCode);
  const activeRoom = room || roomBus.getRoom(roomCode);
  const contestants =
    hasPresenceSnapshot || realtimeContestants.length > 0
      ? realtimeContestants
      : (activeRoom?.players || []).filter((p) => p.id !== 'host_tv');

  return (
    <>
      {isPlayerHost && <FlyingTVRoot mobileContestants={contestants} />}
      <FlyingMobilePlayer
        roomCode={roomCode}
        playerId={playerId}
        playerName={playerName}
        isPlayerHost={isPlayerHost}
        mergedContestants={contestants}
      />
    </>
  );
};

const FlyingMobilePlayer: React.FC<{
  roomCode: string;
  playerId: string;
  playerName: string;
  isPlayerHost: boolean;
  mergedContestants: Array<{ id: string; name: string }>;
}> = ({ roomCode, playerId, playerName, isPlayerHost, mergedContestants }) => {
  const navigate = useNavigate();

  const [flyingState, setFlyingState] = useState<FlyingRoomState>(
    () => roomBus.getLatestGameState<FlyingRoomState>(roomCode, 'FLYING_STATE_SYNC') ?? (isPlayerHost ? getPersistedFlyingState(roomCode) : null) ?? createInitialFlyingState(roomCode)
  );


  useEffect(() => {
    const announce = () => roomBus.emit('FLYING_QUESTION_HISTORY', roomCode, { ids: getSeenFlyingQuestions(), playerId });
    announce();
    const off = roomBus.on('presence_sync', announce, roomCode);
    const offRequest = roomBus.on('REQUEST_ROOM_STATE', announce, roomCode);
    return () => { off(); offRequest(); };
  }, [roomCode, playerId]);
  useEffect(() => {
    if (flyingState.phase === 'QUESTION') rememberFlyingQuestion(flyingState.currentQuestion.id);
  }, [flyingState.phase, flyingState.currentQuestion.id]);
  const stateRef = useRef<FlyingRoomState>(flyingState);
  stateRef.current = flyingState;

  const [emptyWarning, setEmptyWarning] = useState(false);
  const [answerInput, setAnswerInput] = useState<string>('');
  const [hasSubmittedThisRound, setHasSubmittedThisRound] = useState(() => Boolean(flyingState.submissions[playerId]));
  const [submittedAnswer, setSubmittedAnswer] = useState(() => flyingState.submissions[playerId]?.answer ?? '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleReturnToLobby = useCallback(async () => {
    if (!await roomBus.broadcastReturnToLobby(roomCode)) alert('تعذر الرجوع للوبي، حاول مرة أخرى.');
  }, [roomCode]);

  const questionSeconds = useSafeCountdown(flyingState.phase === 'QUESTION'
    ? flyingState.roundStartedAt + ROUND_TIME * 1000
    : undefined);

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
      const previous = stateRef.current;
      if (nextRound < previous.roundNumber ||
          (nextRound === previous.roundNumber && previous.phase !== 'LOBBY' &&
            previous.currentQuestion?.id === payload.question.id)) return;

      const newState: FlyingRoomState = {
        ...stateRef.current,
        phase: 'QUESTION',
        roundNumber: nextRound,
        totalRounds: nextTotal,
        currentQuestion: payload.question,
        timerSeconds: nextDuration,
        roundStartedAt: payload.roundStartedAt ?? Date.now(),
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
      const previous = stateRef.current;
      if ((payload.roundNumber && payload.roundNumber !== previous.roundNumber) ||
          previous.phase === 'REVEALING' || previous.phase === 'PODIUM') return;

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
        cameraStartedAt: payload.cameraStartedAt ?? Date.now(),
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
        const mySub = payload.submissions?.[playerId];
        if (isNewRoundOrQuestion) {
          setAnswerInput('');
          setIsSubmitting(false);
          setHasSubmittedThisRound(Boolean(mySub));
          setSubmittedAnswer(mySub?.answer || '');
        } else if (mySub) {
          setHasSubmittedThisRound(true);
          setSubmittedAnswer(mySub.answer);
        }
      } else if (payload.phase === 'PODIUM') {
        setHasSubmittedThisRound(false);
        setAnswerInput('');
      }
    }, roomCode);

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
      setEmptyWarning(false);
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

  useEffect(() => {
    roomBus.emit('REQUEST_ROOM_STATE', roomCode, {});
  }, [roomCode]);

  // -------------------------------------------------------------
  // Submit Answer (Pure socket broadcast, no local AI evaluation)
  // -------------------------------------------------------------
  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = stripEmojis(answerInput.trim());
    if (hasSubmittedThisRound || isSubmitting || questionSeconds === 0) return;
    if (!clean) { setEmptyWarning(true); return; }

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
      questionId: flyingState.currentQuestion?.id,
      roomCode,
    };

    roomBus.broadcastFlyingAnswer(roomCode, submitPayload);

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

  const myTotalMeters = flyingState.cumulativeMeters[playerId] || 0;
  const q = flyingState.currentQuestion;

  // -------------------------------------------------------------
  // 1. Lobby Phase
  // -------------------------------------------------------------
  if (flyingState.phase === 'CALCULATING') return <ShabahThinkingScreen title="الشبح الطائر يوازن ندرة الإجابات"
    failureMessage={flyingState.analysisFailed?'تعذر التحقق من الإجابات. إجابتك محفوظة ونقاطك كما هي؛ ننتظر قرار المضيف.':undefined}
    onRetry={isPlayerHost && flyingState.analysisFailed?()=>roomBus.emit('FLYING_RESULTS_READY',roomCode,{action:'retryAnalysis',roundNumber:flyingState.roundNumber}):undefined}
    onCancel={isPlayerHost && flyingState.analysisFailed?()=>roomBus.emit('FLYING_RESULTS_READY',roomCode,{action:'cancelAnalysis',roundNumber:flyingState.roundNumber}):undefined}/>;

  if (flyingState.phase === 'LOBBY') {
    return (
      <div dir="rtl" className="min-h-[100dvh] w-full bg-[#08080c] font-sans">
        <UnifiedShabahLobby
          roomCode={roomCode}
          gameId="ai-flying"
          gameTitle="الشبح الطائر"
          role="contestant"
          isPlayerHost={isPlayerHost}
          currentPlayerId={playerId}
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
  if (flyingState.questionBankExhausted) return <FlyingBankExhausted onExit={() => navigate('/')} />;
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
              onClick={async () => {
                if (!await roomBus.broadcastGameStarted(roomCode, { gameId: 'ai-flying' })) {
                  alert('تعذر بدء اللعبة، حاول مرة أخرى');
                }
              }}
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
  if (flyingState.phase === 'QUESTION') {
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
          {(
            <div className="flex flex-col items-center rounded-3xl border border-violet-300/20 bg-[#111427] p-5 text-center text-white shadow-xl shadow-violet-950/30 sm:p-6">
              <span className="mb-4 rounded-full border border-violet-300/25 bg-violet-400/10 px-3 py-1 text-xs font-bold text-violet-200">
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
                    onChange={(e) => { setAnswerInput(e.target.value.slice(0, 140)); setEmptyWarning(false); }}
                    placeholder="اكتب إجابتك هنا..."
                    className="w-full rounded-2xl border-2 border-transparent flying-answer-input bg-[#121328] px-4 py-4 text-center text-base font-bold text-white placeholder:text-zinc-400 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/15"
                    autoFocus
                  />

                  {answerInput.length >= 140 && <p role="status" className="text-sm text-amber-300">الحد الأقصى ١٤٠ حرفًا.</p>}
                  {emptyWarning && <p role="alert" className="text-sm text-amber-300">اكتب إجابتك أولاً.</p>}
                  <button
                    type="submit"
                    disabled={isSubmitting || questionSeconds === 0}
                    className={`w-full rounded-2xl py-3.5 text-sm font-black transition cursor-pointer ${
                      answerInput.trim() && !isSubmitting
                        ? 'bg-gradient-to-r from-violet-400 via-sky-300 to-lime-200 text-zinc-950 active:scale-[.98]'
                        : 'bg-white/10 text-zinc-400 cursor-not-allowed'
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
                      بانتظار انتهاء الوقت وحساب النتيجة
                    </p>
                  </div>

                  <div className="px-4 py-2 bg-[#070B14] border-2 border-black text-white font-mono font-bold text-sm mt-1 max-w-full truncate">
                    "{submittedAnswer}"
                  </div>
                  <WaitingChase/>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Footer Countdown */}
        <footer className="w-full flex items-center justify-center pb-2">
          <div className="pixel-box bg-[#111827] text-white px-4 py-2 border-2 border-black flex items-center gap-2 font-mono text-xs font-black">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>الوقت المتبقي: {questionSeconds} ثانية</span>
          </div>
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 4. Flight reveal
  const contestants = flyingRevealRoster(flyingState.results);
  const overview = flyingState.cameraMode === 'global_overview';
  return (
    <section dir="rtl" data-flying-reveal className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#070b1c] text-white">
      <header className="relative z-10 flex shrink-0 items-center justify-between gap-2 px-3 py-2 text-xs font-bold">
        <span>الجولة {flyingState.roundNumber} / {flyingState.totalRounds}</span>
        <span>{overview ? 'كل الأشباح' : `تحليق ${flyingState.activeSpotlightIndex + 1} من ${contestants.length}`}</span>
        {overview && <details className="relative">
          <summary className="cursor-pointer rounded-lg border border-white/20 px-2 py-1.5">التفاصيل</summary>
          <div className="absolute left-0 top-full mt-2 max-h-[50dvh] w-[min(80vw,24rem)] overflow-auto rounded-2xl border border-white/20 bg-zinc-950 p-3 shadow-xl">
            {Object.values(flyingState.results).map(result => <article key={result.contestantId} className="border-b border-white/10 py-2">
              <b>{result.answer || 'بدون إجابة'}</b>
              <p>{result.contestantName} · +{result.roundMeters} م</p>
              <p className="mt-1 text-zinc-300">{result.comment}</p>
            </article>)}
          </div>
        </details>}
      </header>
      <div className="min-h-0 flex-1">
        <FlyingSkyWorld contestants={contestants} results={flyingState.results}
          cumulativeMeters={flyingState.cumulativeMeters} activeSpotlightIndex={flyingState.activeSpotlightIndex}
          cameraMode={flyingState.cameraMode} cameraStartedAt={flyingState.cameraStartedAt}
          totalRounds={flyingState.totalRounds} currentPlayerId={playerId} />
      </div>
    </section>
  );
};
