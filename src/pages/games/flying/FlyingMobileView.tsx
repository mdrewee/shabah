import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom, roomBus } from '../../../lib/roomBus';
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
import { createInitialFlyingState, getPersistedFlyingState } from './flyingSync';
import {
  Rocket,
  Flame,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  Trophy,
  AlertCircle,
  Crown,
  Zap,
  FlameKindling,
  XCircle,
} from 'lucide-react';

export const FlyingMobileView: React.FC = () => {
  const { code } = useParams<{ code?: string }>();
  const roomCode = (code || 'SHBH').trim().toUpperCase();
  const navigate = useNavigate();

  const [playerId] = useState<string>(() => getOrCreatePlayerId());
  const [playerName] = useState<string>(() => {
    return getPersistedPlayerName() || getOrCreatePlayerName('متسابق');
  });

  const { room } = useRoom(roomCode);
  const activeRoom = room || roomBus.getRoom(roomCode);

  const [flyingState, setFlyingState] = useState<FlyingRoomState>(
    () => getPersistedFlyingState(roomCode) || createInitialFlyingState(roomCode)
  );

  const [answerInput, setAnswerInput] = useState<string>('');
  const [hasSubmittedThisRound, setHasSubmittedThisRound] = useState<boolean>(false);
  const [submittedAnswer, setSubmittedAnswer] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Synchronize with TV host state & events
  useEffect(() => {
    const unsubSync = roomBus.on('FLYING_STATE_SYNC', (evt: any) => {
      const incomingCode = evt?.roomCode;
      const payload: FlyingRoomState = evt?.data ?? evt;
      if (incomingCode && incomingCode !== roomCode) return;
      if (!payload) return;

      setFlyingState(payload);

      // Reset submission input when new question phase arrives
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
      unsubResults?.();
      unsubReturn?.();
    };
  }, [roomCode, playerId]);

  // Submit Answer to TV Host
  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = answerInput.trim();
    if (!clean || hasSubmittedThisRound || isSubmitting) return;

    sound.playClick();
    setIsSubmitting(true);
    setHasSubmittedThisRound(true);
    setSubmittedAnswer(clean);

    // Broadcast answer to room bus
    roomBus.safeBroadcast(roomCode, 'FLYING_SUBMIT_ANSWER', {
      contestantId: playerId,
      contestantName: playerName,
      answer: clean,
      roomCode,
    });

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
        currentPlayerId={playerId}
        onExit={() => navigate('/')}
      />
    );
  }

  // -------------------------------------------------------------
  // 2. Podium Phase
  // -------------------------------------------------------------
  if (flyingState.phase === 'PODIUM') {
    return (
      <div
        dir="rtl"
        className="min-h-screen min-h-[100dvh] w-full bg-[#030305] text-white flex flex-col justify-between p-6 select-none"
      >
        <header className="flex flex-col items-center text-center gap-2 pt-6">
          <Trophy className="w-12 h-12 text-amber-400 animate-bounce" />
          <h1 className="font-sans font-black text-2xl text-amber-300">نهاية السباق السماوي!</h1>
          <p className="text-zinc-400 text-sm">تابع شاشة التلفزيون لمشاهدة منصة التتويج الكبرى</p>
        </header>

        <div className="bg-zinc-950 border-2 border-zinc-800 rounded-3xl p-6 text-center my-auto flex flex-col items-center">
          <span className="text-4xl mb-3">🚀</span>
          <span className="font-sans font-black text-xl text-white mb-1">{playerName}</span>
          <div className="flex items-center gap-2 font-mono text-2xl font-black text-cyan-400 mt-2">
            <span>ارتفاعك النهائي:</span>
            <span>{myTotalMeters} م</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-full py-4 rounded-2xl bg-zinc-900 border border-zinc-700 font-black text-white active:scale-95 transition-transform"
        >
          خروج للرئيسية
        </button>
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
        <header className="relative z-10 w-full flex items-center justify-between">
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
        <main className="relative z-10 w-full flex flex-col my-auto py-4">
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
            {!hasSubmittedThisRound && flyingState.phase === 'QUESTION' ? (
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
                    جهز نفسك للإقلاع على شاشة التلفزيون...
                  </p>
                </div>

                <div className="px-5 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-white font-sans font-black text-base mt-2">
                  "{submittedAnswer}"
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Footer Countdown */}
        <footer className="relative z-10 w-full flex items-center justify-center">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-500">
            <Clock className="w-4 h-4 text-zinc-400" />
            <span>المتبقي: {flyingState.timerSeconds} ثانية</span>
          </div>
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 4. Revealing Phase: Personal Results Display
  // -------------------------------------------------------------
  return (
    <div
      dir="rtl"
      className="min-h-screen min-h-[100dvh] w-full bg-[#030305] text-white flex flex-col justify-between p-5 select-none relative overflow-hidden"
    >
      <header className="w-full flex items-center justify-between">
        <span className="font-mono text-xs text-zinc-400">
          الجولة {flyingState.roundNumber} من {flyingState.totalRounds}
        </span>
        <span className="font-mono text-xs font-black text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-xl border border-cyan-500/30">
          إجمالي الارتفاع: {myTotalMeters}م 🛸
        </span>
      </header>

      {/* Result Card */}
      <main className="w-full flex flex-col my-auto py-4">
        {myResult ? (
          <div className="bg-zinc-950 border-2 border-zinc-800 rounded-3xl p-6 text-center flex flex-col items-center animate-in zoom-in-95 duration-500">
            {/* Visual Icon */}
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center text-3xl mb-3 shadow-lg">
              {myResult.roundMeters > 0 ? '🚀' : '💨'}
            </div>

            {/* Rarity Tier Badge */}
            <MobileTierBadge tier={myResult.tier} meters={myResult.roundMeters} />

            <h2 className="font-sans font-black text-2xl text-white mt-3 mb-1">
              "{myResult.answer}"
            </h2>

            <p className="text-sm text-zinc-300 font-medium mb-4">
              {myResult.comment}
            </p>

            {/* Meters Earned Pill */}
            <div
              className={`w-full py-3.5 rounded-2xl font-mono font-black text-lg flex items-center justify-center gap-2 border ${
                myResult.roundMeters > 0
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500'
              }`}
            >
              <Rocket className="w-5 h-5" />
              <span>+{myResult.roundMeters} متر في هذه الجولة!</span>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 text-center flex flex-col items-center">
            <span className="text-3xl mb-2">👀</span>
            <p className="text-zinc-400 text-sm">تابع شاشة التلفزيون لمشاهدة سباق الأشباح المباشر!</p>
          </div>
        )}
      </main>

      <footer className="w-full text-center text-xs text-zinc-500 font-mono">
        ركّز في شاشة التلفزيون لمتابعة الكاميرا السينمائية!
      </footer>
    </div>
  );
};

function MobileTierBadge({ tier, meters }: { tier: FlyingTier; meters: number }) {
  switch (tier) {
    case 'legendary':
      return (
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 font-mono text-xs font-black">
          <Sparkles className="w-4 h-4 text-amber-400" />
          أسطوري 🔥 (+{meters}م)
        </span>
      );
    case 'rare':
      return (
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-500/20 border border-purple-400 text-purple-300 font-mono text-xs font-black">
          <Zap className="w-4 h-4 text-purple-400" />
          نادر 💎 (+{meters}م)
        </span>
      );
    case 'uncommon':
      return (
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-mono text-xs font-black">
          غير شائع (+{meters}م)
        </span>
      );
    case 'common':
      return (
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-xs font-bold">
          شائع (+{meters}م)
        </span>
      );
    case 'duplicated':
      return (
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-red-500/20 border border-red-500 text-red-400 font-mono text-xs font-black">
          <FlameKindling className="w-4 h-4 text-red-400" />
          مكرر ومحترق 💥 (0م)
        </span>
      );
    case 'failed':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-500/20 border border-rose-500 text-rose-400 font-mono text-xs font-black">
          <XCircle className="w-4 h-4 text-rose-400" />
          إجابة خاطئة ❌ (0م)
        </span>
      );
  }
}
