import { GameTopBar } from '../../components/layout/GameTopBar';
import { CopyCodeButton } from '../../components/common/CopyCodeButton';
import { GeoTopNavControls } from '../../components/common/GeoTopNavControls';
import { ShareRoomButton } from '../../components/common/ShareRoomButton';
import { LobbyRuleBox } from '../../components/common/LobbyRuleBox';
import { MobileReadyButton } from '../../components/common/MobileReadyButton';
import { UnifiedShabahLobby } from '../../components/lobby/UnifiedShabahLobby';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Compass,
  CheckCircle2,
  Clock,
  Trophy,
  Check,
  LogOut,
  Search,
  X,
  HelpCircle,
  Sparkles,
  Lock
} from 'lucide-react';
import { useRoom, roomBus, cleanRoomCode } from '../../lib/roomBus';
import { searchTourismLexicon, TourismLexiconItem } from '../../data/tourismLexicon';
import { DemoSwitcher } from '../../components/common/DemoSwitcher';
import { sound } from '../../lib/audio';
import { formatPoints, toArabicNumber } from '../../utils/numberFormat';

interface BlindTourismMobileViewProps {
  channel?: any;
  roomCode?: string;
  playerId?: string;
  playerName?: string;
}

export const BlindTourismMobileView: React.FC<BlindTourismMobileViewProps> = ({
  channel,
  roomCode: propRoomCode,
  playerId: propPlayerId,
  playerName: propPlayerName,
}) => {
  const params = useParams();
  const roomCode = (propRoomCode || params.code || params.roomId || params.id || '').trim().toUpperCase() || 'TAQ1';
  const roomId = roomCode;

  useEffect(() => {
    console.log(`[DEBUG Mount] Room: "${roomCode}" | Component: "BlindTourismMobileView" | Path: "${window.location.pathname}"`);
    if (!roomCode) {
      console.error('[RoomCode Error]: roomCode is empty or undefined on mount!');
    }
  }, [roomCode]);
  const navigate = useNavigate();
  const { room } = useRoom(roomId);

  const tourismState = room?.tourismState;
  const currentItem = tourismState?.currentItem;

  // Local state
  const [hasLockedInLocal, setHasLockedInLocal] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<TourismLexiconItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isReadyLocally, setIsReadyLocally] = useState<boolean>(false);
  const [isNextReady, setIsNextReady] = useState<boolean>(false);
  const [lastReactionTime, setLastReactionTime] = useState<number>(0);
  const [stageSecondsRemaining, setStageSecondsRemaining] = useState<number>(15);

  const [nickname, setNickname] = useState<string>(() => {
    if (propPlayerName) return propPlayerName;
    try {
      const sessionPlayer = sessionStorage.getItem(`taghesi_player_${roomCode}`);
      if (sessionPlayer) {
        const parsed = JSON.parse(sessionPlayer);
        if (parsed?.name) return parsed.name;
      }
    } catch {}
    return localStorage.getItem('taghesi_playerName') || '';
  });

  const [playerId, setPlayerId] = useState<string>(() => {
    if (propPlayerId) return propPlayerId;
    try {
      const sessionPlayer = sessionStorage.getItem(`taghesi_player_${roomCode}`);
      if (sessionPlayer) {
        const parsed = JSON.parse(sessionPlayer);
        if (parsed?.id) return parsed.id;
      }
    } catch {}
    return localStorage.getItem('taghesi_playerId') || 'p_' + Math.random().toString(36).substring(2, 9);
  });

  const [isJoined, setIsJoined] = useState<boolean>(() => {
    try {
      const sessionPlayer = sessionStorage.getItem(`taghesi_player_${roomCode}`) || localStorage.getItem(`taghesi_player_${roomCode}`);
      if (sessionPlayer) {
        const parsed = JSON.parse(sessionPlayer);
        if (parsed?.id && parsed?.name) return true;
      }
    } catch {}
    return Boolean(propPlayerId || localStorage.getItem('taghesi_playerId'));
  });

  const handleJoin = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      alert('يرجى إدخال اسمك أولاً');
      return;
    }
    console.log('[سياحة عمياء Join Clicked]:', nickname);

    const pid = playerId || 'p_' + Math.random().toString(36).substring(2, 9);
    setPlayerId(pid);
    localStorage.setItem('taghesi_playerId', pid);
    localStorage.setItem('taghesi_playerName', nickname.trim());

    const p = roomBus.joinPlayer(roomCode, nickname.trim(), 'avatar_1', 'team_a', pid);
    if (p?.id && p.id !== pid) {
      setPlayerId(p.id);
      localStorage.setItem('taghesi_playerId', p.id);
    }
    const finalPlayer = p || {
      id: pid,
      name: nickname.trim(),
      avatar: 'avatar_1' as const,
      team: 'team_a' as const,
      joinedAt: Date.now(),
      isOnline: true,
      isReady: false,
      lastPingMs: 25,
    };

    sessionStorage.setItem(`taghesi_player_${roomCode}`, JSON.stringify(finalPlayer));
    localStorage.setItem(`taghesi_player_${roomCode}`, JSON.stringify(finalPlayer));

    if (channel && channel.track && channel.state === 'joined') {
      channel.track(finalPlayer);
    } else {
      roomBus.trackPlayerPresence(roomCode, finalPlayer);
    }
    setIsJoined(true);
  };

  // Player identification
  // Current user's playerId from prop / sessionStorage / localStorage
  const savedPlayerId = useMemo(() => {
    if (propPlayerId) return propPlayerId;
    if (typeof window === 'undefined') return '';
    try {
      const sessionPlayer = sessionStorage.getItem(`taghesi_player_${roomId}`);
      if (sessionPlayer) {
        const parsed = JSON.parse(sessionPlayer);
        if (parsed?.id) return parsed.id;
      }
    } catch {}
    return sessionStorage.getItem('taq_session_player_id') || localStorage.getItem('taghesi_playerId') || '';
  }, [roomId, propPlayerId]);

  const currentPlayer = useMemo(() => {
    return (
      room?.players?.find((p) => p.id === savedPlayerId) ||
      (savedPlayerId
        ? {
            id: savedPlayerId,
            name: nickname || propPlayerName || 'متسابق',
            avatar: 'avatar_1' as const,
            team: 'team_a' as const,
            joinedAt: Date.now(),
            isOnline: true,
            isReady: isReadyLocally,
            lastPingMs: 25,
          }
        : null)
    );
  }, [room?.players, savedPlayerId, nickname, propPlayerName, isReadyLocally]);

  const tourismPlayer = useMemo(() => {
    if (!tourismState || !savedPlayerId) return null;
    return (
      tourismState.players[savedPlayerId] || {
        id: savedPlayerId,
        name: nickname || propPlayerName || 'متسابق',
        score: 0,
        isReady: isReadyLocally,
        lockedAnswer: null,
        isCorrect: false,
        pointsAwarded: 0,
        hasSubmitted: hasLockedInLocal,
      }
    );
  }, [tourismState, savedPlayerId, nickname, propPlayerName, isReadyLocally, hasLockedInLocal]);

  // Stage countdown sync
  useEffect(() => {
    if (!tourismState?.stageEndsAt || tourismState?.gameState !== 'PLAYING') {
      setStageSecondsRemaining(15);
      return;
    }

    const update = () => {
      const remaining = Math.max(0, Math.ceil((tourismState.stageEndsAt! - Date.now()) / 1000));
      setStageSecondsRemaining(remaining);
    };

    update();
    const timer = setInterval(update, 250);
    return () => clearInterval(timer);
  }, [tourismState?.stageEndsAt, tourismState?.gameState, tourismState?.currentStage]);

  const currentRoundNum = tourismState?.currentRound || 1;

  // Check if already locked in from room state or local state for the CURRENT round
  const isLockedIn =
    hasLockedInLocal ||
    Boolean(
      tourismPlayer?.hasLockedIn &&
      tourismState?.currentRound === currentRoundNum &&
      tourismPlayer?.lockedInAnswer
    );

  // Autocomplete suggestions
  const filteredSuggestions = useMemo(() => {
    return searchTourismLexicon(searchQuery, 8);
  }, [searchQuery]);

  // Listen to broadcast ROUND_STARTED from both channel and roomBus
  useEffect(() => {
    const handleRoundReset = (payload?: any) => {
      console.log(`[MOBILE RESET] Round started event received: ${payload?.round || currentRoundNum}. Resetting input states.`);
      setHasLockedInLocal(false);
      setSelectedItem(null);
      setSearchQuery('');
      setIsReadyLocally(false);
      setIsNextReady(false);
    };

    const unsub = roomBus.on('ROUND_STARTED', (payload) => handleRoundReset(payload?.data || payload));
    if (channel) {
      channel.on('broadcast', { event: 'ROUND_STARTED' }, ({ payload }: any) => handleRoundReset(payload));
    }
    return () => unsub();
  }, [channel, currentRoundNum]);

  // Reset state on every round change
  useEffect(() => {
    console.log(`[MOBILE RESET] Round changed to: ${currentRoundNum}. Resetting input states.`);
    setHasLockedInLocal(false);
    setSelectedItem(null);
    setSearchQuery('');
    setIsReadyLocally(false);
    setIsNextReady(false);
  }, [currentRoundNum]);

  const handleSelectItem = (item: TourismLexiconItem) => {
    sound.playClick();
    setSelectedItem(item);
    setSearchQuery(item.nameAr);
  };

  const handleConfirmLockIn = () => {
    const finalAnswer = selectedItem ? selectedItem.nameAr : searchQuery.trim();
    if (!finalAnswer || !savedPlayerId || hasLockedInLocal) return;

    setHasLockedInLocal(true);
    sound.playClick();
    roomBus.lockInTourismAnswer(roomId, savedPlayerId, finalAnswer);
    roomBus.broadcastPlayerSubmission(
      roomId,
      savedPlayerId,
      finalAnswer,
      currentRoundNum
    );
  };

  const handleToggleReady = () => {
    const pid = savedPlayerId || playerId;
    if (!pid) return;
    const nextReady = !isReadyLocally;
    setIsReadyLocally(nextReady);
    sound.playClick();
    roomBus.togglePlayerReady(roomId, pid);
    roomBus.broadcastPlayerReadyUpdate(roomId, pid, nextReady);

    const clean = cleanRoomCode(roomId);
    roomBus.emit('PLAYER_READY_UPDATE', clean, { playerId: pid, isReady: nextReady });

    if (channel && channel.send) {
      try {
        channel.send({
          type: 'broadcast',
          event: 'PLAYER_READY_UPDATE',
          payload: { playerId: pid, isReady: nextReady, roomCode: clean }
        });
      } catch (e) {
        console.warn('broadcast error:', e);
      }
    }

    if (channel && channel.track && channel.state === 'joined') {
      channel.track({
        id: pid,
        name: nickname || currentPlayer?.name || 'متسابق',
        isReady: nextReady,
      });
    } else {
      roomBus.trackPlayerPresence(roomId, {
        id: pid,
        name: nickname || currentPlayer?.name || 'متسابق',
        isReady: nextReady,
      });
    }
  };

  const handleToggleNextReady = async () => {
    const nextState = !isNextReady;
    setIsNextReady(nextState);
    sound.playClick();

    const pid = savedPlayerId || playerId;
    const clean = cleanRoomCode(roomId);

    roomBus.emit('PLAYER_NEXT_ROUND_READY', clean, {
      playerId: pid,
      isReady: nextState,
      round: currentRoundNum,
    });
    roomBus.emit('PLAYER_READY_UPDATE', clean, {
      playerId: pid,
      isReady: nextState,
      roomCode: clean,
    });

    if (channel && channel.send) {
      try {
        await channel.send({
          type: 'broadcast',
          event: 'PLAYER_NEXT_ROUND_READY',
          payload: {
            playerId: pid,
            isReady: nextState,
            round: currentRoundNum,
          },
        });
        await channel.send({
          type: 'broadcast',
          event: 'PLAYER_READY_UPDATE',
          payload: {
            playerId: pid,
            isReady: nextState,
            roomCode: clean,
          },
        });
      } catch (e) {
        console.warn('send PLAYER_NEXT_ROUND_READY error:', e);
      }
    }
  };

  const handleExitGame = () => {
    const confirmed = window.confirm('هل أنت متأكد من الخروج من اللعبة؟');
    if (!confirmed) return;
    sound.playClick();
    if (savedPlayerId) {
      roomBus.leavePlayer(roomId, savedPlayerId);
    }
    navigate('/');
  };

  // Interactive Ephemeral Reactions: 😴, 😝, 😡
  const handleSendReaction = (emoji: string) => {
    const now = Date.now();
    if (now - lastReactionTime < 300) return; // rate limit
    setLastReactionTime(now);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(40);
      } catch {}
    }
    sound.playClick();

    if (savedPlayerId) {
      roomBus.emit('PLAYER_REACTION', roomId, {
        playerId: savedPlayerId,
        emoji,
      });
    }
  };

  const isLobby =
    !tourismState ||
    tourismState.gameState === 'GAME_LOBBY' ||
    tourismState.gameState === 'LOBBY' ||
    tourismState.currentRound === 0;

  const isPlaying = !isLobby && tourismState?.gameState === 'PLAYING';
  const isRevealing = !isLobby && tourismState?.gameState === 'REVEALING';
  const isIntermission = !isLobby && tourismState?.gameState === 'ROUND_INTERMISSION';
  const isGameOver = !isLobby && tourismState?.gameState === 'GAME_OVER';

  const CARD = 'bg-[#F7F4EC] border-2 border-[#2C2A29]/15 rounded-2xl shadow-[0_6px_0_#2C2A29]';
  const BTN_GREEN =
    'bg-[#8A9A5B] hover:bg-[#7D8C50] text-white border-2 border-[#2C2A29]/25 shadow-[0_4px_0_#2C2A29] active:translate-y-1 active:shadow-[0_0px_0_#2C2A29] transition-all font-bold cursor-pointer';
  const BTN_BROWN =
    'bg-[#2C2A29] hover:bg-[#3D3A38] text-[#E5E0D5] border-2 border-[#2C2A29]/40 shadow-[0_4px_0_#1A1817] active:translate-y-1 active:shadow-[0_0px_0_#1A1817] transition-all font-bold cursor-pointer';
  const BTN_DISABLED = 'bg-[#EDE7D9] text-[#2C2A29]/40 border-2 border-[#2C2A29]/15 cursor-not-allowed';

  const STAGE_POINTS_MAP = [0, 5, 4, 3, 2, 1];
  const currentStage = tourismState?.currentStage || 1;
  const currentPointsIfLocked = STAGE_POINTS_MAP[currentStage] || 1;

  // Consensus Skip Hint calculations
  const skipVotes = tourismState?.skipHintVotes || {};
  const hasVotedSkip = Boolean(skipVotes[playerId]);
  const activePlayers = room?.players?.filter((p) => p.isOnline !== false && !p.isBot) || [];
  const votesCount = Object.keys(skipVotes).filter((k) => skipVotes[k]).length;
  const requiredVotes = Math.max(1, Math.ceil((activePlayers.length || 1) / 2));

  const handleVoteSkipHint = () => {
    sound.playClick();
    roomBus.voteSkipTourismHint(roomId, playerId);
  };

  if (!isJoined) {
    return (
      <div className="w-full max-w-lg mx-auto h-[100dvh] overflow-hidden bg-[#E5E0D5] bg-[radial-gradient(#C8C1B2_0.75px,transparent_0.75px)] [background-size:24px_24px] text-[#2C2A29] flex flex-col justify-between p-4 select-none" dir="rtl">
        <GameTopBar roomCode={roomCode} isHost={false} onExit={handleExitGame} />

        <main className="my-auto max-w-sm mx-auto w-full">
          <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] rounded-2xl p-6 shadow-[4px_4px_0px_#2C2A29] text-center flex flex-col gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#8A9A5B] border-2 border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29] flex items-center justify-center text-white mx-auto">
              <Compass className="w-7 h-7" />
            </div>

            <div>
              <h1 className="text-2xl font-black font-display text-[#000000]">سياحة عمياء</h1>
              <p className="text-xs font-bold text-[#5C4033] mt-1">
                رمز الغرفة: <span className="font-mono text-[#000000] font-black">{roomCode}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#000000] mb-1.5 text-right">
                اسمك المستعار:
              </label>
              <input
                type="text"
                autoFocus
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="اكتب اسمك هنا..."
                maxLength={16}
                className="w-full text-base font-bold py-3 px-3.5 rounded-xl border-2 border-[#2C2A29] bg-[#FAF7F2] focus:outline-none focus:border-[#8A9A5B] shadow-inner text-[#000000]"
              />
            </div>

            <button
              type="button"
              onClick={handleJoin}
              className="w-full py-3.5 bg-[#8A9A5B] hover:bg-[#2C2A29] text-white hover:text-[#E5E0D5] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-xl font-display font-black text-base active:translate-y-0.5 active:shadow-[1px_1px_0px_#2C2A29] transition-all cursor-pointer"
            >
              دخول
            </button>
          </div>
        </main>

        <footer className="text-center text-xs text-[#5C4033] font-semibold">
          طق عصي — منصة ألعاب تفاعلية
        </footer>
      </div>
    );
  }

  if (isLobby) {
    const readyNow = Boolean(currentPlayer?.isReady || tourismPlayer?.isReady || isReadyLocally);
    const activePlayers = (room?.players || []).map((p) => ({
      id: p.id,
      name: p.name,
      isReady: Boolean(tourismState?.players?.[p.id]?.isReady ?? p.isReady),
    }));
    const displayPlayers =
      activePlayers.length > 0
        ? activePlayers
        : [
            {
              id: currentPlayer?.id || playerId || 'p1',
              name: currentPlayer?.name || tourismPlayer?.name || nickname || 'ضيف شبح',
              isReady: readyNow,
            },
          ];

    return (
      <UnifiedShabahLobby
        roomCode={room?.code || roomId}
        gameId="geo-blind-tourism"
        gameTitle="شبح المرشد"
        players={displayPlayers}
        role="contestant"
        currentPlayerId={currentPlayer?.id || playerId}
        isReady={readyNow}
        onToggleReady={handleToggleReady}
        onExit={handleExitGame}
      />
    );
  }

  return (
    <div dir="rtl" className="w-full max-w-lg mx-auto h-[100dvh] flex flex-col justify-between p-3.5 pb-36 overflow-y-auto bg-[#000000] text-[#FFFFFF] font-sans select-none"
    >
      <GameTopBar
        roomCode={room?.code || roomId}
        isHost={false}
        currentRound={tourismState?.currentRound || 1}
        totalRounds={tourismState?.totalRounds || 5}
        gameTitle="شبح المرشد"
        onExit={handleExitGame}
      />

      {/* Main Container */}
      <main className="flex-1 flex flex-col p-4 max-w-md w-full mx-auto gap-4">
        {/* ======================================================== */}
        {/* 1. LOBBY VIEW                                            */}
        {/* ======================================================== */}
        {false && (
          <main className="flex-1 flex flex-col items-center justify-center my-2 gap-4 max-w-sm mx-auto w-full">
            <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] rounded-2xl p-5 shadow-[4px_4px_0px_#2C2A29] text-center w-full flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#8A9A5B] border-2 border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29] flex items-center justify-center text-white">
                <Compass className="w-7 h-7 text-white" />
              </div>

              <div>
                <h1 className="text-2xl font-black font-display text-[#000000]">سياحة عمياء</h1>
                <p className="text-xs font-bold text-[#5C4033] mt-0.5">
                  أنت جاهز يا {currentPlayer?.name || tourismPlayer?.name || 'متسابق'}!
                </p>
              </div>

              <LobbyRuleBox
                summary="5 تلميحات تدريجية لكل جولة تكشف معلومات عن الوجهة. كلما قفلت إجابتك بتلميح أبكر حصدت نقاطاً أعلى (حتى +٥)!"
                className="text-xs p-3"
              />

              <MobileReadyButton
                isReady={Boolean(currentPlayer?.isReady || tourismPlayer?.isReady || isReadyLocally)}
                onToggle={handleToggleReady}
              />

              <ShareRoomButton roomCode={room?.code || roomId} />

              <div className="text-center text-xs font-bold text-[#5C4033] bg-[#EDE7D9] px-4 py-1.5 rounded-xl border border-[#2C2A29]/20 w-full">
                الجاهزون: {(() => {
                const map = new Map<string, any>();
                Object.values(tourismState?.players || {}).forEach((p: any) => {
                  if (p?.name) map.set(p.name.trim().toLowerCase(), p);
                });
                const list = Array.from(map.values());
                return `${list.filter(p => p.isReady).length} من ${list.length || 1}`;
              })()} متسابق
              </div>
            </div>
          </main>
        )}

        {/* ======================================================== */}
        {/* 2. PLAYING VIEW                                          */}
        {/* ======================================================== */}
        {isPlaying && (
          <div className="flex-1 flex flex-col gap-4">
            {/* Category Banner & Stage Point Multiplier Badge */}
            <div className={`${CARD} p-4 text-center`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-[#8A9A5B] bg-[#8A9A5B]/15 px-3 py-1 rounded-full border border-[#8A9A5B]/30">
                  المرحلة {toArabicNumber(currentStage)} من ٥
                </span>
                <span className="text-xs font-black text-white bg-[#C68B59] px-3 py-1 rounded-full border-2 border-[#4A463D] shadow-sm">
                  {formatPoints(currentPointsIfLocked)} عند القفل الآن
                </span>
              </div>

              <span className="text-xs font-bold text-[#4A463D] block mb-1">المطلوب تخمينه:</span>
              <div className="text-2xl font-black text-[#24221E]">
                اسم ({currentItem?.type || 'الوجهة'})
              </div>

              {/* Current Stage Hint display on mobile too for quick convenience */}
              {currentItem?.hints[currentStage - 1] && (
                <div className="mt-3 p-3 rounded-2xl bg-[#F3EFE6] border-2 border-[#4A463D]/30 text-right">
                  <span className="text-[10px] font-black text-[#8A9A5B] block mb-0.5">
                    التلميح المفتوح حالياً (#{currentStage}):
                  </span>
                  <p className="text-sm font-black text-[#24221E] leading-relaxed">
                    "{currentItem.hints[currentStage - 1]}"
                  </p>
                </div>
              )}

              {/* Consensus Skip Hint Button */}
              {currentStage < 5 && (
                <button
                  type="button"
                  onClick={handleVoteSkipHint}
                  disabled={hasVotedSkip}
                  className={`w-full mt-3 py-2.5 px-3 rounded-xl border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                    hasVotedSkip
                      ? 'bg-[#8A9A5B] text-white opacity-90 cursor-default'
                      : 'bg-[#C68B59] hover:bg-[#2C2A29] text-white active:translate-y-0.5 cursor-pointer'
                  }`}
                >
                  <span>
                    {hasVotedSkip
                      ? `✓ تم طلب تخطي التلميح (${votesCount}/${requiredVotes})`
                      : `تخطي التلميح (${votesCount}/${requiredVotes})`}
                  </span>
                </button>
              )}
            </div>

            {/* Input & Autocomplete Search Area */}
            {!isLockedIn ? (
              <div className="flex-1 flex flex-col gap-3">
                <div className="relative">
                  <div className="flex items-center bg-[#F7F4EC] border-3 border-[#4A463D] rounded-2xl px-3 py-2.5 shadow-[0_4px_0_#4A463D] focus-within:border-[#8A9A5B] focus-within:shadow-[0_4px_0_#8A9A5B] transition-all">
                    <Search className="w-5 h-5 text-[#4A463D]/60 ml-2 shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSelectedItem(null);
                      }}
                      placeholder="ابحث واكتب الوجهة (مثال: باريس، اليابان...)"
                      className="w-full bg-transparent text-base font-bold text-[#24221E] placeholder-[#4A463D]/40 outline-none"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedItem(null);
                        }}
                        className="text-[#4A463D]/50 hover:text-[#24221E] p-1 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Autocomplete Dropdown */}
                  {searchQuery && !selectedItem && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#F7F4EC] border-3 border-[#4A463D] rounded-2xl shadow-[0_5px_0_#38342C] max-h-56 overflow-y-auto z-40 divide-y-2 divide-[#4A463D]/10">
                      {filteredSuggestions.length > 0 ? (
                        filteredSuggestions.map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSelectItem(item)}
                            className="w-full text-right px-4 py-3 hover:bg-[#8A9A5B]/15 active:bg-[#8A9A5B]/25 flex items-center justify-between transition-colors cursor-pointer"
                          >
                            <span className="font-black text-[#24221E]">{item.nameAr}</span>
                            <span className="text-[11px] font-bold text-[#4A463D]/50 bg-[#F3EFE6] px-2 py-0.5 rounded-lg border border-[#4A463D]/20">
                              {item.type}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-center text-xs font-bold text-[#4A463D]/60">
                          يمكنك كتابة الاسم مباشرة وتأكيده بالزر أدناه
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Item Badge */}
                {selectedItem && (
                  <div className="bg-[#8A9A5B]/15 border-3 border-[#8A9A5B] rounded-2xl p-4 flex items-center justify-between shadow-[0_4px_0_#8A9A5B]">
                    <div>
                      <span className="text-[11px] font-black text-[#5E6B3A] block">إجابتك المختارة:</span>
                      <span className="text-xl font-black text-[#24221E]">{selectedItem.nameAr}</span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-[#8A9A5B] border-2 border-[#4A463D] text-white flex items-center justify-center">
                      <Check className="w-5 h-5" />
                    </div>
                  </div>
                )}

                {/* Tactical Tip */}
                <div className="bg-[#F7F4EC]/70 border-2 border-dashed border-[#4A463D]/30 rounded-2xl p-3 text-xs font-bold text-[#4A463D] leading-relaxed">
                  تذكر: إذا قفلت إجابتك الآن في المرحلة ({toArabicNumber(currentStage)}) ستحصل على {formatPoints(currentPointsIfLocked)} إذا كانت صحيحة، أو ٠ إذا كانت خاطئة!
                </div>
              </div>
            ) : (
              /* Deferred Reveal / Poker Face Lock Confirmation Screen */
              <div className={`${CARD} flex-1 flex flex-col items-center justify-center text-center p-6 gap-3`}>
                <div className="w-16 h-16 rounded-2xl bg-[#8A9A5B] border-3 border-[#4A463D] shadow-[0_4px_0_#38342C] text-white flex items-center justify-center">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-[#24221E]">تم اعتماد إجابتك</h3>
                <div className="text-2xl font-black text-[#8A9A5B] bg-[#8A9A5B]/15 px-6 py-2 rounded-2xl border-2 border-[#8A9A5B]">
                  {selectedItem ? selectedItem.nameAr : searchQuery || tourismPlayer?.lockedInAnswer || 'تم القفل'}
                </div>
                <p className="text-xs font-bold text-[#4A463D] leading-relaxed mt-1">
                  قَفلت بالتلميح رقم {toArabicNumber(tourismPlayer?.lockedInStage || currentStage)}.. انتظر كشف النتائج على الشاشة الكبيرة!
                </p>
              </div>
            )}

            {/* Lock In Submit Button: Elevated above reactions */}
            {!hasLockedInLocal && (
              <div className="fixed bottom-16 left-4 right-4 z-30 max-w-lg mx-auto">
                <button
                  type="button"
                  onClick={handleConfirmLockIn}
                  disabled={!selectedItem && !searchQuery.trim()}
                  className={`w-full py-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2 border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] font-bold active:translate-y-0.5 active:shadow-[1px_1px_0px_#2C2A29] cursor-pointer ${
                    selectedItem || searchQuery.trim() ? 'bg-[#8A9A5B] hover:bg-[#2C2A29] text-white hover:text-[#E5E0D5]' : 'bg-[#EDE7D9] text-[#2C2A29]/40 border-stone-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  <Lock className="w-5 h-5" />
                  <span>قفل الإجابة الآن ({formatPoints(currentPointsIfLocked)})</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. REVEALING VIEW                                        */}
        {/* ======================================================== */}
        {isRevealing && (
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <div className={`${CARD} w-full p-6 text-center flex flex-col items-center gap-3`}>
              <div className="w-16 h-16 rounded-2xl bg-[#8A9A5B] border-3 border-[#4A463D] shadow-[0_4px_0_#38342C] text-white flex items-center justify-center">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-[#24221E]">كشف الوجهة الصحيحة!</h2>
              <div className="text-3xl font-black text-[#8A9A5B] bg-[#8A9A5B]/15 px-6 py-2 rounded-2xl border-2 border-[#8A9A5B]">
                {currentItem?.target}
              </div>
              <p className="text-xs font-bold text-[#4A463D]">
                تابع شاشة التلفزيون لمعرفة النتيجة وحساب النقاط المستحقة!
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. INTERMISSION VIEW                                     */}
        {/* ======================================================== */}
        {isIntermission && (
          <div className="flex-1 flex flex-col justify-between gap-5 py-2">
            <div className={`${CARD} p-5 text-center`}>
              <span className="text-xs font-black text-[#8A9A5B] block mb-1">نتيجة جولتك:</span>
              <div className="text-xl font-black text-[#24221E] mb-2">
                {tourismPlayer?.lockedInAnswer ? `إجابتك: ${tourismPlayer.lockedInAnswer}` : 'لم تقفل إجابتك'}
              </div>

              {tourismPlayer?.isCorrect ? (
                <div className="bg-[#8A9A5B]/15 border-3 border-[#8A9A5B] rounded-2xl p-4 my-3 shadow-[0_3px_0_#8A9A5B]">
                  <div className="text-base font-black text-[#5E6B3A] mb-1">إجابة صحيحة في التلميح {toArabicNumber(tourismPlayer.lockedInStage)}!</div>
                  <div className="text-3xl font-black text-[#24221E] font-mono">
                    {formatPoints(tourismPlayer.pointsAwarded)}
                  </div>
                </div>
              ) : (
                <div className="bg-[#A35A5A]/10 border-3 border-[#A35A5A] rounded-2xl p-4 my-3 shadow-[0_3px_0_#A35A5A]">
                  <div className="text-base font-black text-[#A35A5A]">إجابة غير صحيحة</div>
                  <div className="text-xs font-bold text-[#4A463D] mt-1">الوجهة الصحيحة كانت: {currentItem?.target}</div>
                  <div className="text-xs font-black text-[#A35A5A] mt-1">+٠ لهذه الجولة</div>
                </div>
              )}

              <div className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#F3EFE6] border-2 border-[#4A463D]/30">
                <Trophy className="w-4 h-4 text-[#8A9A5B]" />
                <span className="text-sm font-bold text-[#4A463D]">مجموعك الكلي:</span>
                <span className="font-mono font-black text-xl text-[#24221E]">{formatPoints(tourismPlayer?.score || 0)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleNextReady}
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-base border-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isNextReady
                  ? 'bg-stone-400 text-stone-800 border-2 border-[#2C2A29] shadow-[1px_1px_0px_#2C2A29] translate-y-1'
                  : 'bg-[#8A9A5B] text-white border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-xl font-bold hover:-translate-y-1 active:translate-y-0.5'
              }`}
            >
              {isNextReady ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-stone-800" />
                  <span>بانتظار باقي المتسابقين...</span>
                </>
              ) : (
                <span>جاهز للسؤال التالي ◄</span>
              )}
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* 5. GAME OVER VIEW                                        */}
        {/* ======================================================== */}
        {isGameOver && (
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <div className={`${CARD} w-full p-6 text-center flex flex-col items-center`}>
              <div className="w-16 h-16 rounded-2xl bg-[#8A9A5B] border-3 border-[#4A463D] shadow-[0_4px_0_#38342C] text-white flex items-center justify-center mb-4">
                <Trophy className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-[#24221E] mb-2">انتهت الجولات الخمس</h2>
              <p className="text-sm font-bold text-[#4A463D] mb-4">مجموع نقاطك النهائي</p>
              <div className="text-5xl font-black font-mono text-[#24221E] bg-[#F7F4EC] px-6 py-2 rounded-2xl border-3 border-[#4A463D] shadow-inner mb-4">
                {formatPoints(tourismPlayer?.score || 0)}
              </div>
              <p className="text-xs font-bold text-[#4A463D]">شاهد منصة التتويج للمراكز الأولى على الشاشة الكبيرة!</p>
            </div>
          </div>
        )}
      </main>

      {/* Floating 0.5s Reaction Bar at the very bottom */}
      <div className="fixed bottom-2 left-0 right-0 z-10 flex justify-center gap-4 pointer-events-auto">
        <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-full px-5 py-1.5 flex items-center gap-4">
          <button
            type="button"
            onClick={() => handleSendReaction('😴')}
            className="text-2xl active:scale-125 transition-transform hover:scale-110 cursor-pointer p-1"
            title="نعسان"
          >
            😴
          </button>
          <div className="w-0.5 h-6 bg-[#2C2A29]/20" />
          <button
            type="button"
            onClick={() => handleSendReaction('😝')}
            className="text-2xl active:scale-125 transition-transform hover:scale-110 cursor-pointer p-1"
            title="مطلع لسانه"
          >
            😝
          </button>
          <div className="w-0.5 h-6 bg-[#2C2A29]/20" />
          <button
            type="button"
            onClick={() => handleSendReaction('😡')}
            className="text-2xl active:scale-125 transition-transform hover:scale-110 cursor-pointer p-1"
            title="معصب"
          >
            😡
          </button>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      

      <DemoSwitcher roomId={roomId} currentRole="player" />
    </div>
  );
};
