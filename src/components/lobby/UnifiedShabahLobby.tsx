import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, Copy, Check } from 'lucide-react';
import { ShabahGhost, ShabahMood } from '../mascot/ShabahGhost';
import { QRCodeView } from '../common/QRCodeView';
import { SHABAH_GAMES } from '../../data/shabahGames';
import { sound } from '../../lib/audio';
import { roomBus } from '../../lib/roomBus';
import { getPersistedPlayerName } from '../../utils/playerSession';
import { useRoomSync } from '../../hooks/useRoomSync';
import { createRoom } from '../../services/roomService';

export interface ShabahLobbyPlayer {
  id: string;
  name: string;
  isReady?: boolean;
}

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
  onKickPlayer?: (playerId: string) => void;
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
  onKickPlayer,
  minPlayers = 1,
  onExit,
  extraControls,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isHostRole = role === 'host' || Boolean(isPlayerHost) || searchParams.get('host') === '1';
  const cleanCode = (roomCode || '').trim().toUpperCase();

  // Find game info from approved 5 games
  const titleHint = gameTitle || gameName;
  const matchedGame =
    SHABAH_GAMES.find((g) => g.id === gameId || g.title === titleHint) ||
    SHABAH_GAMES[0];

  const resolvedTitle = matchedGame.title;
  const resolvedBadge = matchedGame.badgeText;
  const resolvedRules = [
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

  // Authoritative registration in Supabase for cross-device & mobile discovery
  useEffect(() => {
    if (role === 'host' && cleanCode) {
      createRoom(cleanCode, matchedGame.id, currentPlayerId).catch((err) => {
        console.warn('[UnifiedShabahLobby] Supabase room register warning:', err);
      });
    }
  }, [cleanCode, role, matchedGame.id, currentPlayerId]);

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
    const unsubState = roomBus.on('STATE_UPDATED', syncFromRoom);
    const unsubJoin = roomBus.on('PLAYER_JOINED', syncFromRoom);
    const unsubReady = roomBus.on('PLAYER_READY_UPDATE', syncFromRoom);
    const unsubKick = roomBus.on('PLAYER_KICKED', (evt) => {
      const kickedId = evt?.data?.playerId || evt?.data;
      if (role === 'contestant' && kickedId === currentPlayerId) {
        sound.playTick();
        navigate('/');
      } else {
        syncFromRoom();
      }
    });

    const unsubTerminated = roomBus.on('ROOM_TERMINATED', () => {
      sound.playTick();
      navigate('/');
    });

    const unsubGameStart = roomBus.on('GAME_STARTED', () => {
      sound.playSuccess();
      setGameStartedNotification(true);
      if (onStartGame) {
        onStartGame();
      }
    });

    return () => {
      unsubState();
      unsubJoin();
      unsubReady();
      unsubKick();
      unsubTerminated();
      unsubGameStart();
    };
  }, [cleanCode, role, currentPlayerId, navigate]);

  // Click-to-copy Room Code (2000ms feedback)
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = async () => {
    if (!cleanCode) return;
    sound.playClick();
    try {
      await navigator.clipboard.writeText(cleanCode);
    } catch {
      const el = document.createElement('textarea');
      el.value = cleanCode;
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

  const currentContestantReady =
    propIsReady !== undefined
      ? propIsReady
      : Boolean(localPlayers.find((p) => p.id === currentPlayerId)?.isReady);

  const { connectedPlayers: realtimePlayers, updateReadyState } = useRoomSync({
    roomCode: cleanCode,
    role,
    playerId: currentPlayerId,
    playerName: getPersistedPlayerName() || 'متسابق',
    isReady: currentContestantReady,
  });

  const sourcePlayers =
    realtimePlayers.length > 0
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

  const readyCount = sanitizedPlayers.filter((p) => p.isReady).length;
  const totalCount = sanitizedPlayers.length;
  const canHostStart = readyCount >= 1 || (totalCount >= 1 && isHostRole);

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

  // Requirement 6: Contextual Top Button (إنهاء الغرفة vs خروج)
  const handleTopExitClick = () => {
    sound.playClick();
    if (role === 'host') {
      // Screen/TV Mode: Terminates room for everyone and redirects everyone to /
      roomBus.emit('ROOM_TERMINATED', cleanCode, { reason: 'HOST_CLOSED' });
      if (typeof (roomBus as any).terminateRoom === 'function') {
        (roomBus as any).terminateRoom(cleanCode);
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
  const handleKick = (playerId: string) => {
    sound.playClick();
    if (onKickPlayer) {
      onKickPlayer(playerId);
    } else {
      roomBus.kickPlayer(cleanCode, playerId);
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
  const handleHostStartGame = () => {
    sound.playClick();
    sound.playSuccess();
    setGameStartedNotification(true);
    const startPayload = {
      startedAt: Date.now(),
      gameId: matchedGame.id,
      gameTitle: matchedGame.title,
      roomCode: cleanCode,
    };
    roomBus.broadcastGameStarted(cleanCode, startPayload);
    if (onStartGame) {
      onStartGame();
    }
  };

  const joinUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/enter-name?room=${encodeURIComponent(cleanCode)}`
      : `/enter-name?room=${encodeURIComponent(cleanCode)}`;

  return (
    <div
      dir="rtl"
      className="min-h-screen min-h-[100dvh] w-full bg-[#000000] text-[#FFFFFF] flex flex-col justify-between px-4 py-4 sm:py-6 select-none overflow-x-hidden"
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
                className="shabah-pill-surface px-4 py-1.5 text-xs sm:text-sm font-black text-[#0A0A0A] hover:bg-neutral-100 transition-transform duration-150 active:scale-95 cursor-pointer block"
              >
                {role === 'host' ? 'إنهاء الغرفة' : 'خروج'}
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
      <main className="w-full max-w-3xl mx-auto my-auto py-4 flex flex-col gap-4">
        {gameStartedNotification && (
          <div className="p-3.5 rounded-2xl bg-emerald-500 text-white font-black text-center text-sm sm:text-base border-2 border-emerald-400">
            🚀 تم إطلاق بدء اللعبة بنجاح! جاهزية اللوبي مكتملة.
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
                  <div
                    onClick={handleCopyCode}
                    title="اضغط لنسخ الكود"
                    className="relative cursor-pointer px-4 py-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 border-2 border-[#0A0A0A] flex flex-col items-center justify-center min-w-[125px] h-28 sm:h-32 transition-transform active:scale-95"
                  >
                    {copiedCode ? (
                      <div className="flex flex-col items-center justify-center gap-1 text-emerald-700">
                        <Check className="w-6 h-6 stroke-[3]" />
                        <span className="text-xs sm:text-sm font-black">
                          تم نسخ الكود!
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
                  </div>

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
              <div className="flex items-center justify-between mb-3">
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
                <div className="flex flex-wrap gap-2.5">
                  {sanitizedPlayers.map((player) => {
                    const playerReady = Boolean(player.isReady);
                    const isMe = currentPlayerId && player.id === currentPlayerId;

                    return (
                      <div
                        key={player.id}
                        className={`inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-[#FFFFFF] border-[2.5px] border-[#0A0A0A] text-[#0A0A0A] ${
                          isMe ? 'ring-2 ring-[#A855F7]' : ''
                        }`}
                      >
                        {/* Status Dot */}
                        <span
                          className={`w-3 h-3 rounded-full shrink-0 border border-[#0A0A0A] ${
                            playerReady ? 'bg-[#22C55E]' : 'bg-neutral-400'
                          }`}
                        />

                        {/* Player Name */}
                        <span className="text-sm font-black text-[#0A0A0A] truncate max-w-[140px]">
                          {player.name}
                        </span>

                        <span className="text-[11px] font-bold text-neutral-600">
                          {playerReady ? '[جاهز]' : '[ينتظر]'}
                        </span>

                        {/* Host Kick Button [×] */}
                        {role === 'host' && (
                          <button
                            type="button"
                            onClick={() => handleKick(player.id)}
                            title={`طرد ${player.name}`}
                            className="w-5 h-5 rounded-full bg-[#0A0A0A] text-[#FFFFFF] hover:bg-red-600 flex items-center justify-center text-xs font-black transition-colors cursor-pointer mr-0.5"
                          >
                            <X className="w-3.5 h-3.5 stroke-[3]" />
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
      <footer className="w-full max-w-3xl mx-auto pb-1">
        <div className="shabah-border-wrap">
          <div className="shabah-border-inner">
            <div className="shabah-surface p-3 sm:p-4">
              {role === 'contestant' ? (
                <div className="flex flex-col gap-2.5 w-full">
                  <button
                    type="button"
                    onClick={handleContestantToggleReady}
                    className={`w-full py-3.5 rounded-xl text-base sm:text-lg font-black transition-transform duration-150 active:scale-[0.98] cursor-pointer ${
                      currentContestantReady
                        ? 'bg-white text-[#0A0A0A] border-[3px] border-[#0A0A0A] hover:bg-neutral-100'
                        : 'shabah-btn-black'
                    }`}
                  >
                    {currentContestantReady ? 'إلغاء الجاهزية' : 'أنا جاهز'}
                  </button>

                  {isHostRole && (
                    <button
                      type="button"
                      disabled={!canHostStart}
                      onClick={handleHostStartGame}
                      className={`w-full py-3.5 rounded-xl text-base sm:text-lg font-black transition-transform duration-150 active:scale-[0.98] ${
                        canHostStart
                          ? 'shabah-btn-black cursor-pointer shadow-[0_0_20px_rgba(74,222,128,0.35)]'
                          : 'bg-neutral-200 text-neutral-500 cursor-not-allowed border-2 border-neutral-300'
                      }`}
                    >
                      {canHostStart ? 'بدء اللعبة (كمضيف)' : 'بدء اللعبة (في انتظار جاهزية متسابق على الأقل)'}
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!canHostStart}
                  onClick={handleHostStartGame}
                  className={`w-full py-3.5 rounded-xl text-base sm:text-lg font-black transition-transform duration-150 active:scale-[0.98] ${
                    canHostStart
                      ? 'shabah-btn-black cursor-pointer'
                      : 'bg-neutral-200 text-neutral-500 cursor-not-allowed border-2 border-neutral-300'
                  }`}
                >
                  {canHostStart ? 'بدء اللعبة' : 'بدء اللعبة (في انتظار جاهزية متسابق على الأقل)'}
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
