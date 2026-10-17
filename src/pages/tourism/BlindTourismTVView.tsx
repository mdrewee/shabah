import { FullscreenButton } from '../../components/common/FullscreenButton';
import { GeoTopNavControls } from '../../components/common/GeoTopNavControls';
import { GeographyGameLobby } from '../../components/common/GeographyGameLobby';
import { CopyCodeButton } from '../../components/common/CopyCodeButton';
import { LobbyRuleBox } from '../../components/common/LobbyRuleBox';
import { GameTopBar } from '../../components/layout/GameTopBar';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Trophy,
  Users,
  Compass,
  Play,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Crown,
  CheckCircle2,
  Check,
  Clock,
  LogOut,
  MapPin,
  ChevronLeft
} from 'lucide-react';
import { useRoom, roomBus, cleanRoomCode } from '../../lib/roomBus';
import { QRCodeView } from '../../components/common/QRCodeView';
import { DemoSwitcher } from '../../components/common/DemoSwitcher';
import { sound } from '../../lib/audio';
import { formatPoints, toArabicNumber } from '../../utils/numberFormat';

export const BlindTourismTVView: React.FC = () => {
  const params = useParams();
  const roomCode = (params.code || params.roomId || params.id || '').trim().toUpperCase() || 'TAQ1';
  const roomId = roomCode;

  useEffect(() => {
    console.log(`[DEBUG Mount] Room: "${roomCode}" | Component: "BlindTourismTVView" | Path: "${window.location.pathname}"`);
    if (!roomCode) {
      console.error('[RoomCode Error]: roomCode is empty or undefined on mount in BlindTourismTVView!');
    }
  }, [roomCode]);
  const navigate = useNavigate();
  const { room } = useRoom(roomId);

  

  const tourismState = room?.tourismState;
  const currentItem = tourismState?.currentItem;
  const currentStage = tourismState?.currentStage || 1;

  // Reaction notifications per player (0.5s ephemeral)
  const [reactions, setReactions] = useState<Record<string, string>>({});

  // Countdown timer for 15s per hint stage
  const [stageSecondsRemaining, setStageSecondsRemaining] = useState<number>(15);

  // Authoritative host registration
  useEffect(() => {
    const unregister = roomBus.registerHost(roomId);
    return () => unregister();
  }, [roomId]);

  // Ensure room tourismState is initialized on mount
  useEffect(() => {
    if (room && !room.tourismState && roomBus.isHosting(roomId)) {
      roomBus.fetchTourismQuestions().then((q) => {
        roomBus.initTourismGame(roomId, q);
      });
    }
  }, [room, roomId]);

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

  // Listen for Ephemeral Reactions (0.5s strictly)
  useEffect(() => {
    const unsubscribe = roomBus.on('PLAYER_REACTION', (payload) => {
      const cleanCode = roomId.toUpperCase().replace(/^ROOM_/, '');
      const incomingCode = (payload.roomCode || '').toUpperCase().replace(/^ROOM_/, '');
      if (incomingCode === cleanCode) {
        const { playerId, emoji } = payload.data || {};
        if (playerId && emoji) {
          setReactions((prev) => ({ ...prev, [playerId]: emoji }));
          sound.playBuzzer();

          setTimeout(() => {
            setReactions((prev) => {
              if (prev[playerId] === emoji) {
                const updated = { ...prev };
                delete updated[playerId];
                return updated;
              }
              return prev;
            });
          }, 500); // Strictly 500ms
        }
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  // Listen for PLAYER_READY_UPDATE events and update player isReady state
  useEffect(() => {
    const cleanCode = cleanRoomCode(roomId);
    const channel = roomBus.getSupabaseChannel(roomId);

    const handleReady = (payloadData: any) => {
      const { playerId, isReady } = payloadData || {};
      if (!playerId) return;

      const roomObj = roomBus.getRoom(cleanCode);
      if (roomObj) {
        const pl = roomObj.players.find((p) => p.id === playerId);
        if (pl) {
          pl.isReady = isReady !== undefined ? Boolean(isReady) : !pl.isReady;
          roomBus.saveRoom(roomObj);
        }
      }
    };

    const unsub = roomBus.on('PLAYER_READY_UPDATE', (payload) => {
      const incoming = (payload.roomCode || '').toUpperCase().replace(/^ROOM_/, '');
      if (incoming === cleanCode && payload.data) {
        handleReady(payload.data);
      }
    });

    let channelSub: any = null;
    if (channel && channel.on) {
      try {
        channelSub = channel.on('broadcast', { event: 'PLAYER_READY_UPDATE' }, ({ payload }: any) => {
          handleReady(payload);
        });
      } catch (e) {
        console.warn('Channel subscribe error:', e);
      }
    }

    return () => {
      unsub();
    };
  }, [roomId]);

  // Active connected players list (strictly deduplicated by player id)
  const playersList = useMemo(() => {
    const list = room?.players || [];
    const tPlayers = tourismState?.players || {};
    const map = new Map<string, any>();
    list.forEach((p) => {
      if (!p || !p.name || p.id === 'host_tv') return;
      const tp = tPlayers[p.id];
      const key = p.id;
      const item = {
        ...p,
        isReady: Boolean(p.isReady || tp?.isReady),
        score: tp?.score ?? 0,
        hasLockedIn: tp?.hasLockedIn ?? false,
        lockedInStage: tp?.lockedInStage ?? null,
        lockedInAnswer: tp?.lockedInAnswer ?? null,
        isCorrect: tp?.isCorrect ?? false,
        pointsAwarded: tp?.pointsAwarded ?? 0,
      };
      if (map.has(key)) {
        const prev = map.get(key);
        map.set(key, { ...prev, ...item, isReady: Boolean(prev.isReady || item.isReady) });
      } else {
        map.set(key, item);
      }
    });
    return Array.from(map.values());
  }, [room?.players, tourismState?.players]);

  const lockedInCount = useMemo(() => {
    return playersList.filter((p) => p.hasLockedIn).length;
  }, [playersList]);

  // Sorted leaderboard by total score
  const sortedLeaderboard = useMemo(() => {
    return [...playersList].sort((a, b) => b.score - a.score);
  }, [playersList]);

  const isLobby =
    !tourismState ||
    tourismState.gameState === 'GAME_LOBBY' ||
    tourismState.gameState === 'LOBBY' ||
    tourismState.currentRound === 0;

  const isPlaying = !isLobby && tourismState?.gameState === 'PLAYING';
  const isRevealing = !isLobby && tourismState?.gameState === 'REVEALING';
  const isIntermission = !isLobby && tourismState?.gameState === 'ROUND_INTERMISSION';
  const isGameOver = !isLobby && tourismState?.gameState === 'GAME_OVER';

  const [nextReadyPlayerIds, setNextReadyPlayerIds] = useState<Set<string>>(new Set());

  const handleAdvanceToNextRound = useCallback(() => {
    sound.playClick();
    setNextReadyPlayerIds(new Set());
    const currentRound = tourismState?.currentRound || 1;
    const totalRounds = tourismState?.totalRounds || 5;
    if (currentRound >= totalRounds) {
      roomBus.tvStartNextTourismRound(roomId, totalRounds + 1);
    } else {
      roomBus.tvStartNextTourismRound(roomId, currentRound + 1);
    }
  }, [roomId, tourismState?.currentRound, tourismState?.totalRounds]);

  // Automated Hands-Free Advance when all players are ready for next round
  useEffect(() => {
    const clean = cleanRoomCode(roomId);
    const channel = roomBus.getSupabaseChannel(roomId);

    const handleNextRoundReady = (payload: any) => {
      const { playerId, isReady } = payload || {};
      if (!playerId) return;

      setNextReadyPlayerIds((prev) => {
        const updated = new Set(prev);
        if (isReady) {
          updated.add(playerId);
        } else {
          updated.delete(playerId);
        }

        const active = playersList.filter((p) => p.isOnline !== false);
        if (active.length > 0 && updated.size >= active.length && (isRevealing || isIntermission)) {
          console.log('[TV AUTO ADVANCE] All players ready for next round in Blind Tourism!');
          setTimeout(() => {
            handleAdvanceToNextRound();
          }, 400);
        }

        return updated;
      });
    };

    const unsubNext = roomBus.on('PLAYER_NEXT_ROUND_READY', (payload) => {
      const incoming = (payload.roomCode || '').toUpperCase().replace(/^ROOM_/, '');
      if (incoming === clean && payload.data) {
        handleNextRoundReady(payload.data);
      }
    });

    let channelSub: any = null;
    if (channel && channel.on) {
      try {
        channelSub = channel
          .on('broadcast', { event: 'PLAYER_NEXT_ROUND_READY' }, ({ payload }: any) => {
            handleNextRoundReady(payload);
          });
      } catch (e) {
        console.warn('Channel subscribe error:', e);
      }
    }

    return () => {
      unsubNext();
    };
  }, [roomId, isRevealing, isIntermission, playersList, handleAdvanceToNextRound]);

  const handleResetToLobby = () => {
    sound.playClick();
    roomBus.resetTourismToLobby(roomId);
  };

  const handleKickPlayer = useCallback(async (targetPlayerId: string, playerName: string) => {
    const confirmKick = window.confirm(`هل أنت متأكد من طرد اللاعب "${playerName}"؟`);
    if (!confirmKick) return;

    roomBus.kickPlayer(roomId, targetPlayerId);

    const clean = cleanRoomCode(roomId);
    const channel = roomBus.getSupabaseChannel(roomId);
    if (channel && channel.send) {
      try {
        await channel.send({
          type: 'broadcast',
          event: 'PLAYER_KICKED',
          payload: { playerId: targetPlayerId }
        });
      } catch (e) {
        console.warn('kick broadcast error:', e);
      }
    }
  }, [roomId]);

  const handleStartGame = () => {
    sound.playClick();
    if (playersList.length === 1) {
      roomBus.addMockPlayer(roomId);
    }
    setTimeout(() => {
      roomBus.tvStartNextTourismRound(roomId, 1);
    }, 100);
  };

  const handleEndGame = () => {
    const confirmed = window.confirm('هل أنت متأكد من إنهاء اللعبة لجميع اللاعبين والعودة للرئيسية؟');
    if (!confirmed) return;
    roomBus.endGameSession(roomId);
    navigate('/');
  };

  const joinUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join?code=${room?.code || roomId}`
      : `/join?code=${room?.code || roomId}`;

  const STAGE_POINTS_MAP = [0, 5, 4, 3, 2, 1];

  if (isLobby) {
    return (
      <GeographyGameLobby
        gameTitle="سياحة عمياء"
        gameCategory="فئة الجغرافيا • ٥ تلميحات"
        icon={<Compass className="w-7 h-7 text-white" />}
        ruleSummary="5 تلميحات تدريجية لكل جولة تكشف معلومات عن الوجهة. كلما قفلت إجابتك بتلميح أبكر حصدت نقاطاً أعلى (حتى +٥)!"
        roomCode={room?.code || roomId}
        players={playersList}
        onStartGame={handleStartGame}
        onExitGame={handleEndGame}
        onKickPlayer={handleKickPlayer}
        canStart={playersList.length >= 1}
      />
    );
  }

  return (
    <div
      dir="rtl"
      className="h-screen w-screen h-[100dvh] overflow-hidden bg-[#E5E0D5] bg-[radial-gradient(#C8C1B2_0.75px,transparent_0.75px)] [background-size:24px_24px] text-[#2C2A29] flex flex-col justify-between font-sans select-none selection:bg-[#8A9A5B] selection:text-white"
    >
      <style>{`
        @keyframes reactionPop {
          0% { transform: scale(0) translateY(4px); opacity: 0; }
          50% { transform: scale(1.35) translateY(-4px); opacity: 1; }
          100% { transform: scale(1) translateY(-8px); opacity: 0.95; }
        }
      `}</style>

      <GameTopBar
        roomCode={room?.code || roomId}
        isHost={true}
        currentRound={tourismState?.currentRound || 1}
        totalRounds={tourismState?.totalRounds || 5}
        gameTitle="سياحة عمياء"
        onTerminate={handleResetToLobby}
        onExit={handleResetToLobby}
      />

      {/* Main Content Area */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* ======================================================== */}
        {/* MAIN TV PLAYING VIEW (PROGRESSIVE HINTS DISPLAY)       */}
        {/* ======================================================== */}
        <div className="flex-1 relative h-full bg-grain p-6 flex flex-col gap-5 min-w-0">
          {/* Question / Target Category Banner */}
          {!isLobby && currentItem && (
            <div className="shrink-0 z-20 bg-[#F7F4EC] border-2 border-[#2C2A29]/15 rounded-3xl px-8 py-4 shadow-[0_6px_0_#38342C] flex items-center justify-between gap-6">
              <div className="text-right min-w-0">
                <span className="text-xs font-black text-[#8A9A5B] block mb-0.5">التصنيف المستهدف</span>
                <span className="text-2xl font-black text-[#24221E]">
                  خمن اسم الـ ({currentItem.type}) من التلميحات التدريجية
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {isPlaying && (
                  <div className={`px-4 py-2 rounded-2xl border-2 border-[#2C2A29] shadow-[0_3px_0_#2C2A29] text-center font-mono font-black text-lg ${
                    stageSecondsRemaining <= 4 ? 'bg-[#A35A5A] text-white' : 'bg-[#C68B59] text-white'
                  }`}>
                    <span className="text-[10px] block font-sans">الوقت</span>
                    <span>{stageSecondsRemaining}s</span>
                  </div>
                )}
                <div className="px-4 py-2 rounded-2xl bg-[#F3EFE6] border-2 border-[#4A463D] shadow-[0_3px_0_#4A463D] text-center">
                  <span className="text-[10px] font-black text-[#4A463D] block">المرحلة الحالية</span>
                  <span className="text-lg font-mono font-black text-[#24221E]">
                    {tourismState?.currentStage || 1} من 5
                  </span>
                </div>
                <div className="px-4 py-2 rounded-2xl bg-[#8A9A5B] border-2 border-[#4A463D] shadow-[0_3px_0_#38342C] text-center text-white">
                  <span className="text-[10px] font-black block">المقفلون</span>
                  <span className="text-lg font-mono font-black">
                    {lockedInCount} / {playersList.length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Progressive Hint Stages Container inside 3D tactile molded card */}
          <div className="relative flex-1 min-h-0 bg-[#F7F4EC] border-8 border-[#4A463D] rounded-3xl shadow-[inset_0_4px_8px_rgba(0,0,0,0.06),0_10px_0_#38342C] p-6 flex flex-col justify-between overflow-y-auto">
            {currentItem && (
              <div className="space-y-4 my-auto">
                {currentItem.hints.map((hintText, idx) => {
                  const stageNum = idx + 1;
                  const isRevealed = (tourismState?.currentStage || 1) >= stageNum || isRevealing || isIntermission;
                  const isCurrentActive = (tourismState?.currentStage || 1) === stageNum && isPlaying;
                  const points = STAGE_POINTS_MAP[stageNum];

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border-3 transition-all flex items-center justify-between gap-4 ${
                        isCurrentActive
                          ? 'bg-[#8A9A5B]/15 border-[#8A9A5B] shadow-[0_4px_0_#8A9A5B] scale-[1.01]'
                          : isRevealed
                          ? 'bg-[#F7F4EC] border-[#4A463D] shadow-[0_3px_0_#4A463D]'
                          : 'bg-[#F3EFE6]/60 border-dashed border-[#4A463D]/30 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-xl border-2 border-[#4A463D] flex flex-col items-center justify-center font-black text-sm shrink-0 ${
                            isCurrentActive
                              ? 'bg-[#8A9A5B] text-white shadow-sm'
                              : isRevealed
                              ? 'bg-[#DDD7C8] text-[#24221E]'
                              : 'bg-[#F7F4EC] text-[#4A463D]/40'
                          }`}
                        >
                          <span className="text-[10px] leading-none text-current">تلميح</span>
                          <span className="text-base leading-none text-current">{stageNum}</span>
                        </div>

                        <div className="min-w-0">
                          {isRevealed ? (
                            <p className="font-black text-lg text-[#24221E] leading-relaxed">
                              {hintText}
                            </p>
                          ) : (
                            <div className="flex items-center gap-2 text-sm font-bold text-[#4A463D]/50">
                              <HelpCircle className="w-4 h-4" />
                              <span>يفتح بعد قليل في المرحلة {stageNum}...</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex flex-col items-end">
                        <span className={`text-xs font-black px-2.5 py-1 rounded-xl border-2 ${
                          isRevealed
                            ? 'bg-[#8A9A5B] text-white border-[#4A463D]'
                            : 'bg-[#DDD7C8] text-[#4A463D] border-[#4A463D]/30'
                        }`}>
                          {formatPoints(points)}
                        </span>
                        {isCurrentActive && (
                          <span className="text-[10px] font-bold text-[#8A9A5B] mt-1">
                            المرحلة النشطة الآن!
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Ephemeral Reaction Floaters */}
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
              {Object.entries(reactions).map(([pId, emoji]) => {
                const p = playersList.find((pl) => pl.id === pId);
                return (
                  <div
                    key={pId + '_' + emoji}
                    className="bg-[#F7F4EC] text-[#24221E] px-4 py-2 rounded-2xl border-3 border-[#4A463D] shadow-[0_4px_0_#38342C] flex items-center gap-2.5"
                    style={{ animation: 'reactionPop 0.5s ease-out forwards' }}
                  >
                    <span className="font-black text-sm">{p?.name || 'متسابق'}</span>
                    <span className="text-2xl">{emoji}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar: Leaderboard & Poker Face Player Badges */}
        <aside className="w-96 bg-[#F7F4EC] border-r-4 border-[#4A463D] flex flex-col z-10 shrink-0">
          <div className="p-4 border-b-4 border-[#4A463D] flex items-center justify-between bg-[#F3EFE6]">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#8A9A5B] border-2 border-[#4A463D] shadow-[0_3px_0_#38342C] text-white flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <h3 className="font-black text-[#24221E] text-base">
                {isRevealing || isIntermission ? 'نتائج الجولة والكشف' : 'حالة المتسابقين'}
              </h3>
            </div>
            <span className="text-xs font-black text-[#4A463D] bg-[#F7F4EC] px-2.5 py-1 rounded-lg border-2 border-[#4A463D]/30">
              {playersList.length} لاعب
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-grain">
            {isRevealing || isIntermission
              ? /* Reveal view showing who got it right and points awarded */
                playersList.map((p) => (
                  <div
                    key={p.id}
                    className={`p-3.5 rounded-2xl border-3 flex items-center justify-between transition-all ${
                      p.isCorrect
                        ? 'bg-[#F7F4EC] border-[#8A9A5B] shadow-[0_4px_0_#8A9A5B]'
                        : 'bg-[#F3EFE6] border-[#4A463D]/40 shadow-[0_4px_0_#4A463D]/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl border-2 border-[#4A463D] flex items-center justify-center font-black text-xs shrink-0 ${
                          p.isCorrect ? 'bg-[#8A9A5B] text-white' : 'bg-[#DDD7C8] text-[#4A463D]/60'
                        }`}
                      >
                        {p.isCorrect ? '✓' : '✗'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-sm text-[#24221E] flex items-center gap-1.5">
                          <span className="truncate">{p.name}</span>
                          {reactions[p.id] && (
                            <span
                              key={reactions[p.id]}
                              className="text-xl select-none pointer-events-none inline-block"
                              style={{ animation: 'reactionPop 0.5s ease-out forwards' }}
                            >
                              {reactions[p.id]}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-bold text-[#4A463D]">
                          {p.lockedInAnswer ? `خمّن: ${p.lockedInAnswer}` : 'لم يخمن'}
                        </div>
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      {p.isCorrect ? (
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-black text-white bg-[#8A9A5B] px-2 py-0.5 rounded-md border border-[#4A463D]">
                            {formatPoints(p.pointsAwarded)}
                          </span>
                          <span className="text-[10px] font-bold text-[#8A9A5B] mt-0.5">
                            (تلميح {toArabicNumber(p.lockedInStage)})
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-black text-[#A35A5A]">خطأ (0ن)</span>
                      )}
                    </div>
                  </div>
                ))
              : /* Playing Poker Face State: Shows "Locked in at Stage X" WITHOUT revealing correctness! */
                sortedLeaderboard.map((p, idx) => (
                  <div
                    key={p.id}
                    className={`p-3 rounded-2xl border-3 flex items-center justify-between ${
                      p.hasLockedIn
                        ? 'bg-[#F7F4EC] border-[#8A9A5B] shadow-[0_4px_0_#8A9A5B]'
                        : 'bg-[#F7F4EC] border-[#4A463D] shadow-[0_4px_0_#4A463D]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl border-2 border-[#4A463D] flex items-center justify-center font-black text-xs shrink-0 ${
                          idx === 0 ? 'bg-[#8A9A5B] text-white' : 'bg-[#DDD7C8] text-[#24221E]'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <span className="font-black text-sm text-[#24221E] truncate">{p.name}</span>
                      {reactions[p.id] && (
                        <span
                          key={reactions[p.id]}
                          className="text-xl select-none pointer-events-none inline-block"
                          style={{ animation: 'reactionPop 0.5s ease-out forwards' }}
                        >
                          {reactions[p.id]}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isPlaying && (
                        p.hasLockedIn ? (
                          <span className="text-[11px] bg-[#8A9A5B] text-white font-black px-2 py-0.5 rounded-lg flex items-center gap-1 border border-[#4A463D]">
                            <Check className="w-3 h-3" />
                            <span>قفل بالتلميح {p.lockedInStage}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] bg-[#DDD7C8] text-[#4A463D] font-bold px-2 py-0.5 rounded-lg border border-[#4A463D]/30">
                            يفكر...
                          </span>
                        )
                      )}
                      <span className="font-mono font-black text-lg text-[#24221E]">{p.score}ن</span>
                    </div>
                  </div>
                ))}
          </div>

          {/* Intermission & Results Next Round Action Bar */}
          {(isRevealing || isIntermission) && (
            <div className="p-4 border-t-2 border-[#2C2A29]/15 bg-[#E5E0D5]">
              <div className="text-xs font-bold text-[#2C2A29]/70 mb-2 flex items-center justify-between">
                <span>جاهزية اللاعبين للسؤال التالي:</span>
                <span className="font-mono font-bold text-[#C68B59]">
                  {nextReadyPlayerIds.size} / {playersList.length}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAdvanceToNextRound}
                className="w-full py-3.5 bg-[#8A9A5B] hover:bg-[#2C2A29] text-white hover:text-[#E5E0D5] rounded-xl font-bold text-sm border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] transition-all cursor-pointer flex items-center justify-center gap-2 hover:-translate-y-1 active:translate-y-0.5"
              >
                <span>
                  {(tourismState?.currentRound || 1) >= (tourismState?.totalRounds || 5)
                    ? 'إنهاء اللعبة والنتائج النهائية ◄'
                    : 'الانتقال للسؤال التالي ◄'}
                </span>
              </button>
            </div>
          )}
        </aside>

        {/* Floating Manual Host Override Button during REVEALING or INTERMISSION */}
        {(isRevealing || isIntermission) && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#F7F4EC] border-2 border-[#2C2A29] rounded-2xl px-6 py-3 shadow-[6px_6px_0px_#2C2A29] flex items-center gap-6">
            <div className="text-right">
              <span className="text-xs font-bold text-[#5C4033] block">
                جاهزية المتسابقين ({nextReadyPlayerIds.size} / {playersList.length})
              </span>
              <span className="text-sm font-black text-[#000000]">
                {(tourismState?.currentRound || 1) >= (tourismState?.totalRounds || 5)
                  ? 'اكتملت الجولات'
                  : `جولة ${tourismState?.currentRound || 1} من ${tourismState?.totalRounds || 5}`}
              </span>
            </div>
            <button
              type="button"
              onClick={handleAdvanceToNextRound}
              className="py-3 px-8 bg-[#8A9A5B] text-white border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-xl font-bold hover:bg-[#2C2A29] hover:text-[#E5E0D5] hover:-translate-y-1 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>
                {(tourismState?.currentRound || 1) >= (tourismState?.totalRounds || 5)
                  ? 'إنهاء اللعبة والنتائج النهائية ◄'
                  : 'الانتقال للسؤال التالي ◄'}
              </span>
            </button>
          </div>
        )}

        {/* Big Reveal Announcement Banner Overlay during REVEALING */}
        {isRevealing && currentItem && (
          <div className="absolute top-28 left-1/2 -translate-x-1/2 z-50 bg-[#F7F4EC] border-4 border-[#8A9A5B] shadow-[0_8px_0_#8A9A5B] rounded-3xl p-6 text-center max-w-lg w-full">
            <span className="text-xs font-black text-[#8A9A5B] block mb-1">الإجابة والوجهة الصحيحة هي:</span>
            <div className="text-4xl font-black text-[#24221E] mb-2">{currentItem.target}</div>
            <span className="text-xs font-bold text-[#4A463D] bg-[#F3EFE6] px-3 py-1 rounded-full border border-[#4A463D]/20">
              التصنيف: {currentItem.type}
            </span>
          </div>
        )}

        {/* FINAL PODIUM OVERLAY */}
        {isGameOver && (
          <div className="absolute inset-0 bg-grain z-50 flex flex-col items-center justify-center p-8">
            <div className="max-w-2xl w-full bg-[#F7F4EC] border-2 border-[#2C2A29]/15 rounded-3xl p-8 shadow-[0_8px_0_#38342C] text-center">
              <div className="w-20 h-20 rounded-2xl bg-[#8A9A5B] border-3 border-[#4A463D] shadow-[0_5px_0_#38342C] text-white flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-11 h-11" />
              </div>

              <h2 className="text-3xl font-black text-[#24221E] mb-1">منصة التتويج النهائية</h2>
              <p className="text-sm font-bold text-[#4A463D] mb-10">أبطال تحدي سياحة عمياء بعد نهاية الجولات الخمس</p>

              <div className="flex items-end justify-center gap-4 mb-8">
                {sortedLeaderboard[1] && (
                  <div className="flex-1 bg-[#F7F4EC] border-2 border-[#2C2A29]/15 rounded-2xl p-4 shadow-[0_5px_0_#4A463D] flex flex-col items-center">
                    <div className="w-10 h-10 rounded-xl bg-[#DDD7C8] border-2 border-[#4A463D] text-[#24221E] font-black text-sm flex items-center justify-center mb-2">
                      2
                    </div>
                    <span className="font-black text-base text-[#24221E] mb-1">{sortedLeaderboard[1].name}</span>
                    <span className="font-mono font-black text-xl text-[#4A463D]">{sortedLeaderboard[1].score} ن</span>
                  </div>
                )}

                {sortedLeaderboard[0] && (
                  <div className="flex-1 bg-[#8A9A5B]/15 border-4 border-[#8A9A5B] rounded-2xl p-6 shadow-[0_6px_0_#8A9A5B] flex flex-col items-center -translate-y-4">
                    <Crown className="w-8 h-8 text-[#8A9A5B] mb-1" />
                    <div className="w-12 h-12 rounded-xl bg-[#8A9A5B] border-2 border-[#4A463D] text-white font-black text-lg flex items-center justify-center mb-2 shadow-[0_3px_0_#38342C]">
                      1
                    </div>
                    <span className="font-black text-lg text-[#24221E] mb-1">{sortedLeaderboard[0].name}</span>
                    <span className="font-mono font-black text-2xl text-[#24221E]">{sortedLeaderboard[0].score} ن</span>
                  </div>
                )}

                {sortedLeaderboard[2] && (
                  <div className="flex-1 bg-[#F7F4EC] border-2 border-[#2C2A29]/15 rounded-2xl p-4 shadow-[0_5px_0_#4A463D] flex flex-col items-center">
                    <div className="w-10 h-10 rounded-xl bg-[#DDD7C8] border-2 border-[#4A463D] text-[#24221E] font-black text-sm flex items-center justify-center mb-2">
                      3
                    </div>
                    <span className="font-black text-base text-[#24221E] mb-1">{sortedLeaderboard[2].name}</span>
                    <span className="font-mono font-black text-xl text-[#4A463D]">{sortedLeaderboard[2].score} ن</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => roomBus.resetTourismToLobby(roomId)}
                className="px-10 py-4 bg-[#8A9A5B] hover:bg-[#7D8D50] text-white rounded-2xl font-black text-base border-3 border-[#4A463D] shadow-[0_5px_0_#38342C] active:translate-y-1 active:shadow-[0_1px_0_#38342C] transition-all cursor-pointer"
              >
                العودة إلى الردهة واللعب مجدداً
              </button>
            </div>
          </div>
        )}
      </div>

      <DemoSwitcher roomId={roomId} currentRole="tv" />
    </div>
  );
};
