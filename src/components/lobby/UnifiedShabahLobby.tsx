import { isRoomHost } from '../../services/roomService';
import { normalizeGameId } from '../../utils/gameIds';
import { useConfirmation } from '../common/ConfirmationProvider';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Copy, Check, Timer, Trophy, Crown } from 'lucide-react';
import { ShabahGhost, ShabahMood } from '../mascot/ShabahGhost';
import { QRCodeView } from '../common/QRCodeView';
import { SHABAH_GAMES } from '../../data/shabahGames';
import { sound } from '../../lib/audio';
import { roomBus } from '../../lib/roomBus';
import { getPersistedPlayerName } from '../../utils/playerSession';
import { useRoomSync } from '../../hooks/useRoomSync';

export interface ShabahLobbyPlayer {
  id: string;
  name: string;
  isReady?: boolean;
  isHost?: boolean;
  isOnline?: boolean;
}

export type LobbyManualStart = { disabled: boolean; onStart: () => void };

export interface UnifiedShabahLobbyProps {
  roomCode: string;
  gameId?: string;
  gameTitle?: string;
  gameName?: string;
  rulesSummary?: string | string[];
  gameRulesSummary?: string | string[];
  players?: ShabahLobbyPlayer[];
  role?: 'host' | 'contestant';
  isPlayerHost?: boolean;
  currentPlayerId?: string;
  isReady?: boolean;
  onToggleReady?: () => void;
  onStartGame?: () => void;
  manualStart?: LobbyManualStart;
  onKickPlayer?: (playerId: string) => void;
  onGameSync?: (gameId?: string) => void;
  minPlayers?: number;
  onExit?: () => void;
  extraControls?: React.ReactNode;
}

export const UnifiedShabahLobby: React.FC<UnifiedShabahLobbyProps> = ({
  roomCode,
  gameId,
  gameTitle,
  gameName,
  rulesSummary,
  gameRulesSummary,
  players: propPlayers,
  role = 'host',
  isPlayerHost = false,
  currentPlayerId,
  isReady: propIsReady,
  onToggleReady,
  onStartGame,
  manualStart,
  onKickPlayer,
  onGameSync,
  minPlayers = 1,
  onExit,
  extraControls,
}) => {
  const navigate = useNavigate();
  const confirm = useConfirmation();
  const cleanCode = (roomCode || '').trim().toUpperCase();
  React.useLayoutEffect(() => { window.scrollTo(0, 0); }, [cleanCode]);
  const isHostRole = isRoomHost(cleanCode) && (role === 'host' || isPlayerHost);
  const startingGame = useRef(false);

  // Find game info from approved 5 games
  const titleHint = gameTitle || gameName;
  const matchedGame =
    SHABAH_GAMES.find((g) => g.id === normalizeGameId(gameId) || g.title === titleHint) ||
    SHABAH_GAMES[0];

  const resolvedTitle = matchedGame.title;
  const resolvedBadge = matchedGame.badgeText;
  const customRules = rulesSummary || gameRulesSummary;
  const resolvedRules = customRules ? (Array.isArray(customRules) ? customRules : [customRules]) : [
    matchedGame.shortExplanation,
    'استعد وتأكد من الجاهزية قبل بدء التحدي المباشر!',
  ];

  // Room state listener to keep real-time players and readiness accurate
  const [localPlayers, setLocalPlayers] = useState<ShabahLobbyPlayer[]>(() => {
    const r = roomBus.getRoom(cleanCode);
    if (r && r.players.length > 0) {
      return r.players.map((p) => ({
        id: p.id,
        name: p.name,
        isReady: Boolean(p.isReady),
      }));
    }
    return propPlayers || [];
  });

  const [gameStartedNotification, setGameStartedNotification] = useState(false);

  // Safe game sync notification
  useEffect(() => {
    if (onGameSync) {
      onGameSync(gameId || matchedGame.id);
    }
  }, [gameId, matchedGame.id, onGameSync]);

  useEffect(() => {
    const syncFromRoom = () => {
      const r = roomBus.getRoom(cleanCode);
      if (r) {
        setLocalPlayers(
          r.players.map((p) => ({
            id: p.id,
            name: p.name,
            isReady: Boolean(p.isReady),
          }))
        );
      }
    };

    syncFromRoom();
    const unsubState = roomBus.on('STATE_UPDATED', syncFromRoom, cleanCode);
    const unsubJoin = roomBus.on('PLAYER_JOINED', syncFromRoom, cleanCode);
    const unsubReady = roomBus.on('PLAYER_READY_UPDATE', syncFromRoom, cleanCode);
    
    const unsubKick = roomBus.on('FORCE_PLAYER_KICK', syncFromRoom, cleanCode);

    const unsubGameStart = roomBus.on('GAME_STARTED', () => {
      sound.playSuccess();
      setGameStartedNotification(true);
    }, cleanCode);

    return () => {
      unsubState();
      unsubJoin();
      unsubReady();
      unsubKick();
      unsubGameStart();
    };
  }, [cleanCode, role, currentPlayerId, navigate]);

  // Click-to-copy Room Code (2000ms feedback)
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = async () => {
    if (!cleanCode) return;
    sound.playClick();
    if (navigator.share) {
      try {
        await navigator.share({ title: matchedGame.title, url: joinUrl });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(joinUrl);
    } catch {
      const el = document.createElement('textarea');
      el.value = joinUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiedCode(true);
    window.setTimeout(() => {
      setCopiedCode(false);
    }, 2000);
  };

  // Dynamic mascot mood & commentary
  const [mood, setMood] = useState<ShabahMood>('judging');
  const [remark, setRemark] = useState<string>('باقي أحد ولا نقفل الباب؟');
  const [gazeOffset, setGazeOffset] = useState<{ x: number; y: number } | null>(null);

  const initialReady = propIsReady ?? Boolean(localPlayers.find((p) => p.id === currentPlayerId)?.isReady);

  const { connectedPlayers: realtimePlayers, hasPresenceSnapshot, updateReadyState } = useRoomSync({
    roomCode: cleanCode,
    role,
    playerId: currentPlayerId,
    playerName: getPersistedPlayerName() || 'متسابق',
    isReady: initialReady,
  });

  const currentContestantReady = propIsReady ??
    realtimePlayers.find((p) => p.id === currentPlayerId)?.isReady ?? initialReady;

  // Handle return to lobby event across devices
  useEffect(() => {
    const unsubReturn = roomBus.on('RETURN_TO_LOBBY', () => {
      setAutoStartCountdown(null);
      setGameStartedNotification(false);
      setLocalPlayers((prev) => prev.map((p) => ({ ...p, isReady: false })));
    }, cleanCode);
    return () => {
      unsubReturn();
    };
  }, [cleanCode]);

  const sourcePlayers =
    hasPresenceSnapshot || realtimePlayers.length > 0
      ? realtimePlayers
      : localPlayers.length > 0
      ? localPlayers
      : propPlayers || [];

  // Strict deduplication by ID
  const playersMap = new Map<string, ShabahLobbyPlayer>();
  sourcePlayers.forEach((p) => {
    if (p && p.id && p.id !== 'host_tv') {
      playersMap.set(p.id, p);
    }
  });
  if (hasPresenceSnapshot) {
    for (const player of localPlayers) {
      if (player.id !== 'host_tv' && !playersMap.has(player.id)) {
        playersMap.set(player.id, { ...player, isReady: false, isOnline: false });
      }
    }
  }
  const displayPlayers = Array.from(playersMap.values());

  // Filter out fallback names if persisted name exists
  const sanitizedPlayers = displayPlayers.map((p, idx) => {
    const raw = (p.name || '').trim();
    if (!raw || raw === 'لاعب' || raw === 'Player') {
      const persisted = currentPlayerId === p.id ? getPersistedPlayerName() : '';
      return {
        ...p,
        name: persisted || `متسابق ${idx + 1}`,
      };
    }
    return p;
  });

  const readyCount = sanitizedPlayers.filter((p) => p.isReady && p.isOnline !== false).length;
  const totalCount = sanitizedPlayers.filter((p) => p.isOnline !== false).length;
  const requiredPlayers = Math.max(minPlayers, matchedGame.minPlayers);
  const canHostStart = isHostRole && totalCount >= requiredPlayers && totalCount <= matchedGame.maxPlayers;

  const prevPlayersCountRef = useRef<number>(totalCount);
  const prevReadyCountRef = useRef<number>(readyCount);

  useEffect(() => {
    const prevTotal = prevPlayersCountRef.current;
    const prevReady = prevReadyCountRef.current;

    if (totalCount > prevTotal) {
      const newest = sanitizedPlayers[sanitizedPlayers.length - 1];
      setMood('surprised');
      setRemark(`حيّ الله ${newest?.name || 'الضيف'}! جهّز نفسك.`);
      setGazeOffset({ x: (Math.random() > 0.5 ? 1 : -1) * 5, y: 3 });
    } else if (totalCount < prevTotal) {
      setMood('angry');
      setRemark('من اللي انسحب قبل ما نبدأ؟!');
      setGazeOffset({ x: -5, y: 2 });
    } else if (readyCount > prevReady) {
      setMood('happy');
      setRemark(
        readyCount === totalCount && totalCount > 0
          ? 'الكل جاهز! يلا نبدأ الجلد!'
          : 'كفو! باقي الشباب يضغطون جاهز...'
      );
      setGazeOffset({ x: 4, y: 2 });
    } else if (readyCount < prevReady) {
      setMood('judging');
      setRemark('ليش شلت الجاهزية؟ متردد؟');
      setGazeOffset({ x: -4, y: 1 });
    }

    prevPlayersCountRef.current = totalCount;
    prevReadyCountRef.current = readyCount;

    const timer = window.setTimeout(() => {
      setGazeOffset(null);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [totalCount, readyCount]);

  // Requirement: 3-second auto-start when at least 2 players are ready
  const [autoStartCountdown, setAutoStartCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (gameStartedNotification || manualStart) {
      setAutoStartCountdown(null);
      return;
    }

    if (readyCount === totalCount && canHostStart) {
      const endsAt = Date.now() + 3000;
      setAutoStartCountdown(3);
      sound.playTick();
      const timer = window.setInterval(() => {
        const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
        setAutoStartCountdown(remaining);
        if (remaining === 0) {
          window.clearInterval(timer);
          void handleHostStartGame();
        }
      }, 250);

      return () => window.clearInterval(timer);
    } else {
      setAutoStartCountdown(null);
    }
  }, [readyCount, totalCount, canHostStart, gameStartedNotification, Boolean(manualStart)]);

  // Requirement 6: Contextual Top Button (إنهاء الغرفة vs خروج)
  const handleTopExitClick = async () => {
    sound.playClick();
    if (isHostRole) {
      if (!await confirm('تنهي الغرفة وتخرج جميع اللاعبين؟')) return;
      if (!await roomBus.terminateRoom(cleanCode)) {
        alert('تعذر إنهاء الغرفة، حاول مرة أخرى');
        return;
      }
      navigate('/');
    } else {
      // Player Mobile Mode: Only leaves for themselves without closing room for others
      if (currentPlayerId) {
        roomBus.leavePlayer(cleanCode, currentPlayerId);
      }
      if (onExit) {
        onExit();
      } else {
        navigate('/');
      }
    }
  };

  // Kick Player handler
  const handleKickPlayer = async (playerId: string) => {
    sound.playClick();
    if (onKickPlayer) {
      onKickPlayer(playerId);
    } else if (!await roomBus.broadcastForcePlayerKick(cleanCode, playerId)) {
      alert('تعذر طرد اللاعب، حاول مرة أخرى');
    }
  };

  // Contestant Ready toggle
  const handleContestantToggleReady = () => {
    sound.playClick();
    const nextReady = !currentContestantReady;
    updateReadyState(nextReady);
    if (onToggleReady) {
      onToggleReady();
    }
  };

  // Host Start Game handler
  const handleHostStartGame = async () => {
    if (!canHostStart || startingGame.current) return;
    startingGame.current = true;
    sound.playClick();
    const startPayload = {
      startedAt: Date.now(),
      gameId: matchedGame.id,
      gameTitle: matchedGame.title,
      roomCode: cleanCode,
    };
    const started = await roomBus.broadcastGameStarted(cleanCode, startPayload);
    startingGame.current = false;
    if (!started) {
      alert('تعذر بدء اللعبة، حاول مرة أخرى');
      return;
    }
    sound.playSuccess();
    setGameStartedNotification(true);
    if (onStartGame) {
      onStartGame();
    }
  };

  const joinUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/room/${encodeURIComponent(cleanCode)}`
      : `/room/${encodeURIComponent(cleanCode)}`;

  return (
    <div
      dir="rtl"
      data-room-lobby
      className="min-h-[100dvh] w-full bg-[#08080c] text-white flex flex-col gap-5 px-4 py-5 sm:py-6 select-none overflow-x-hidden font-sans"
    >
      {/* 1. Top Bar: Game Badge | Mascot & Speech Bubble | Contextual Button [إنهاء الغرفة] or [خروج] */}
      <header className="w-full max-w-3xl mx-auto flex flex-col items-center relative pt-1">
        <div className="w-full flex items-center justify-between mb-1">
          {/* Game Tag Badge */}
          <span className="px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-black text-neutral-300">
            {resolvedTitle}
          </span>

          {/* Requirement 6: Contextual Top Button */}
          <div className="shabah-pill-wrap">
            <div className="shabah-pill-inner">
              <button
                type="button"
                onClick={handleTopExitClick}
                className="shabah-pill-surface min-h-12 px-4 py-1.5 text-xs sm:text-sm font-black text-[#0A0A0A] hover:bg-neutral-100 transition-transform duration-150 active:scale-95 cursor-pointer block"
              >
                {isHostRole ? 'إنهاء الغرفة' : 'خروج'}
              </button>
            </div>
          </div>
        </div>

        {/* Mascot at top center (w-20 h-20 sm:w-24 sm:h-24) */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
          <ShabahGhost mood={mood} gazeOffset={gazeOffset} className="w-full h-full" />
        </div>

        {/* Speech Bubble Commentary */}
        <div className="mt-1 shabah-pill-wrap max-w-md">
          <div className="shabah-pill-inner">
            <div className="shabah-pill-surface px-4 py-1.5 text-xs sm:text-sm font-black text-[#0A0A0A] text-center">
              {remark}
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="w-full max-w-3xl mx-auto flex-1 flex flex-col gap-4">
        {/* 3-Second Auto-Start Countdown Banner on TV / Host */}
        {autoStartCountdown !== null && autoStartCountdown > 0 && !gameStartedNotification && (
          <div className="p-4 sm:p-6 rounded-2xl bg-[#0A0A0A] text-white border-2 border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.4)] flex flex-col items-center justify-center text-center gap-2 animate-pulse">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-emerald-400">
              <Timer className="w-5 h-5 animate-spin" />
              <span>جاهزية اللاعبين مكتملة! تبدأ اللعبة تلقائياً خلال:</span>
            </div>
            <div className="text-4xl sm:text-6xl font-black font-mono text-emerald-400">
              {['٠', '١', '٢', '٣', '٤', '٥'][autoStartCountdown] || autoStartCountdown}
            </div>
          </div>
        )}

        {gameStartedNotification && (
          <div className="p-3.5 rounded-2xl bg-emerald-500 text-white font-black text-center text-sm sm:text-base border-2 border-emerald-400 flex items-center justify-center gap-2">
            <Check className="w-5 h-5 text-white stroke-[3] shrink-0" />
            <span>تم إطلاق بدء اللعبة بنجاح! جاهزية اللوبي مكتملة.</span>
          </div>
        )}

        {/* Compact Room Code + QR Strip Card */}
        <div className="shabah-border-wrap">
          <div className="shabah-border-inner">
            <div className="shabah-surface p-4 sm:p-5 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Right Side: Game Info */}
                <div className="flex-1 text-center sm:text-right">
                  <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#0A0A0A] text-[#FFFFFF] text-[11px] font-black mb-1.5">
                    <span>{resolvedBadge}</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-[#0A0A0A]">
                    {resolvedTitle}
                  </h1>
                  <div className="mt-1 space-y-1">
                    {resolvedRules.map((line, i) => (
                      <p
                        key={i}
                        className="text-xs sm:text-sm font-bold text-neutral-700 leading-relaxed"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Left Side: Click-to-Copy Room Code + Compact QR Code */}
                <div className="flex items-center gap-3 shrink-0">
                  {/* Clickable Room Code Box */}
                  <button
                    type="button"
                    aria-label={`مشاركة رابط الغرفة ${cleanCode}`}
                    onClick={handleCopyCode}
                    title="مشاركة رابط الدخول"
                    className="relative cursor-pointer px-4 py-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 border-2 border-[#0A0A0A] flex flex-col items-center justify-center min-w-[112px] sm:min-w-[125px] h-28 sm:h-32 transition-transform active:scale-95"
                  >
                    {copiedCode ? (
                      <div className="flex flex-col items-center justify-center gap-1 text-emerald-700">
                        <Check className="w-6 h-6 stroke-[3]" />
                        <span className="text-xs sm:text-sm font-black">
                          تم نسخ الرابط!
                        </span>
                      </div>
                    ) : (
                      <>
                        <span className="text-[11px] font-black text-neutral-500 mb-0.5 flex items-center gap-1">
                          <span>كود الغرفة</span>
                          <Copy className="w-3 h-3" />
                        </span>
                        <div
                          dir="ltr"
                          className="text-2xl sm:text-3xl font-black tracking-[0.15em] text-[#0A0A0A] leading-none my-1"
                        >
                          {cleanCode}
                        </div>
                        <span className="text-[10px] font-bold text-neutral-500">
                          اضغط للنسخ
                        </span>
                      </>
                    )}
                  </button>

                  {/* Compact QR Code */}
                  <div className="w-28 h-28 sm:w-32 sm:h-32 p-2 bg-white border-2 border-[#0A0A0A] rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center [&>div]:!p-0 [&>div]:!border-0 [&>div]:!rounded-none [&_svg]:!w-full [&_svg]:!h-full">
                      <QRCodeView value={joinUrl} size={104} />
                    </div>
                  </div>
                </div>
              </div>

              {extraControls && (
                <div className="pt-3 border-t-2 border-neutral-200">{extraControls}</div>
              )}
            </div>
          </div>
        </div>

        {/* Connected Players Roster Card */}
        <div className="shabah-border-wrap">
          <div className="shabah-border-inner">
            <div className="shabah-surface p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h2 className="text-base sm:text-lg font-black text-[#0A0A0A]">
                  اللاعبون المتصلون ({totalCount})
                </h2>
                <div className="flex items-center gap-3 text-xs font-black text-neutral-700">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] inline-block" />
                    جاهز ({readyCount})
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-400 inline-block" />
                    ينتظر ({Math.max(0, totalCount - readyCount)})
                  </span>
                </div>
              </div>

              {sanitizedPlayers.length === 0 ? (
                <div className="py-6 text-center rounded-2xl bg-neutral-50 border-2 border-dashed border-neutral-300">
                  <p className="text-sm font-black text-neutral-600">
                    بانتظار دخول المتسابقين بالكود أو مسح الباركود...
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap items-start gap-2">
                  {sanitizedPlayers.map((player, index) => {
                    const playerReady = player.isOnline !== false && Boolean(player.isReady);
                    const isMe = currentPlayerId && player.id === currentPlayerId;

                    return (
                      <div
                        key={player.id}
                        className={`inline-flex w-fit max-w-full min-w-0 items-center gap-1.5 px-2 py-1.5 rounded-full bg-[#FFFFFF] border-[2.5px] border-[#0A0A0A] text-[#0A0A0A] ${
                          isMe ? 'ring-2 ring-[#A855F7]' : ''
                        }`}
                      >
                        <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full ghost-reaction-bubble" style={{backgroundColor: ['#c4b5fd','#7dd3fc','#86efac','#fde68a'][index % 4]}}>
                          <ShabahGhost mood={playerReady ? 'happy' : 'idle'} trackPointer={false} className="size-5" />
                        </span>
                        {/* Status Dot: Waiting (dark zinc) vs Ready (glowing emerald) */}
                        <span
                          className={`size-2 rounded-full shrink-0 transition-all ${
                            playerReady
                              ? 'bg-emerald-500 shadow-[0_0_8px_#10B981]'
                              : 'bg-zinc-600 border border-zinc-500'
                          }`}
                        />

                        {/* Player Name */}
                        <span className="text-sm font-black text-[#0A0A0A] truncate max-w-[8ch] sm:max-w-[16ch]">
                          {player.name}
                        </span>

                        <span className="sr-only">
                          {player.isOnline === false ? 'انقطع اتصاله' : playerReady ? 'جاهز' : 'متصل'}
                        </span>

                        {/* Host Kick Button [×] */}
                        {isHostRole && !player.isHost && player.id !== currentPlayerId && (
                          <button
                            type="button"
                            onClick={() => handleKickPlayer(player.id)}
                            className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer mr-0.5"
                            title="طرد اللاعب"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 3. Bottom Action Bar with Requirement 7 Iridescent Hover */}
      {isHostRole && !manualStart && !canHostStart && <p role="status" className="text-center text-sm text-amber-200">
        {totalCount > matchedGame.maxPlayers
          ? `الحد الأقصى ${matchedGame.maxPlayers} لاعبين · الموجودون الآن ${totalCount}`
          : `نحتاج ${requiredPlayers} لاعبين للبدء · الموجودون الآن ${totalCount}`}
      </p>}
      <footer className="sticky bottom-0 z-20 w-full max-w-3xl mx-auto bg-[#08080c]/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
        <div className="shabah-border-wrap">
          <div className="shabah-border-inner">
            <div className="shabah-surface p-3 sm:p-4">
              {manualStart ? (isHostRole
                ? <button type="button" disabled={manualStart.disabled || gameStartedNotification}
                    onClick={manualStart.onStart} className="shabah-btn-black min-h-12 w-full rounded-xl py-3 font-black disabled:cursor-not-allowed disabled:opacity-50">ابدأ</button>
                : <p role="status" className="py-3 text-center font-bold text-neutral-800">بانتظار الهوست</p>
              ) : role === 'contestant' ? (
                <div className="flex flex-col gap-2.5 w-full">
                  <button
                    type="button"
                    onClick={handleContestantToggleReady}
                    className={`w-full min-h-12 py-3.5 rounded-xl text-base sm:text-lg font-black transition-transform duration-150 active:scale-[0.98] ${
                      currentContestantReady
                        ? 'bg-white text-[#0A0A0A] border-[3px] border-[#0A0A0A] hover:bg-neutral-100 cursor-pointer'
                        : 'shabah-btn-black cursor-pointer'
                    }`}
                  >
                    {currentContestantReady ? 'إلغاء الجاهزية' : 'أنا جاهز'}
                  </button>

                  {isHostRole && (
                    <button
                      type="button"
                      onClick={handleHostStartGame}
                      disabled={!canHostStart || gameStartedNotification}
                      className="w-full min-h-12 py-3.5 rounded-xl text-base sm:text-lg font-black transition-transform duration-150 active:scale-[0.98] shabah-btn-black cursor-pointer"
                    >
                      بدء اللعبة الآن
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleHostStartGame}
                  disabled={!canHostStart || gameStartedNotification}
                  className="w-full min-h-12 py-3.5 rounded-xl text-base sm:text-lg font-black transition-transform duration-150 active:scale-[0.98] shabah-btn-black cursor-pointer"
                >
                  بدء اللعبة الآن
                </button>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UnifiedShabahLobby;
