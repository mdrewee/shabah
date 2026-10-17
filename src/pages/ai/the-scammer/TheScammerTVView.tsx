// src/pages/ai/the-scammer/TheScammerTVView.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  Gavel,
  Clock,
  Trophy,
  Crown,
  AlertTriangle,
  MessageSquare,
  Users,
  X,
  Play,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Award
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useRoom, roomBus } from '../../../lib/roomBus';
import { sound } from '../../../lib/audio';
import { ScammerTopBar } from './components/ScammerTopBar';
import { UnifiedShabahLobby } from '../../../components/lobby/UnifiedShabahLobby';
import {
  ScammerPhase,
  WeirdProduct,
  ChatMessage,
  PlayerNegotiation,
  ScammerScore
} from './types';
import { WEIRD_PRODUCTS_BANK } from './data/productsBank';

const REVEAL_DURATION = 20;
const NEGOTIATION_DURATION = 150;

interface TheScammerTVViewProps {
  roomCode?: string;
}

export const TheScammerTVView: React.FC<TheScammerTVViewProps> = ({ roomCode: propRoomCode }) => {
  const params = useParams();
  const navigate = useNavigate();
  const roomCode = (propRoomCode || params.code || params.roomId || params.id || '').trim().toUpperCase() || 'TAQ1';

  const { room } = useRoom(roomCode);
  const activeRoom = room || roomBus.getRoom(roomCode);

  // Realtime Channel References (Strict Singleton Guard)
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef<boolean>(false);

  // Core Phase & Game State
  const [phase, setPhase] = useState<ScammerPhase>('LOBBY');
  const phaseRef = useRef<ScammerPhase>('LOBBY');
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const [currentProduct, setCurrentProduct] = useState<WeirdProduct>(WEIRD_PRODUCTS_BANK[0]);
  const currentProductRef = useRef<WeirdProduct>(WEIRD_PRODUCTS_BANK[0]);
  useEffect(() => { currentProductRef.current = currentProduct; }, [currentProduct]);

  const [timeLeft, setTimeLeft] = useState(0);
  const timeLeftRef = useRef(0);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  // Negotiations map: playerId -> PlayerNegotiation
  const [negotiations, setNegotiations] = useState<Record<string, PlayerNegotiation>>({});
  const negotiationsRef = useRef<Record<string, PlayerNegotiation>>({});
  useEffect(() => { negotiationsRef.current = negotiations; }, [negotiations]);

  // Winner calculation
  const [winner, setWinner] = useState<PlayerNegotiation | null>(null);
  const winnerRef = useRef<PlayerNegotiation | null>(null);
  useEffect(() => { winnerRef.current = winner; }, [winner]);

  // Broadcast fallback players
  const [broadcastPlayers, setBroadcastPlayers] = useState<any[]>([]);

  // Ready players tracking in Lobby
  const [readyPlayerIds, setReadyPlayerIds] = useState<Set<string>>(new Set());
  const readyPlayerIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => { readyPlayerIdsRef.current = readyPlayerIds; }, [readyPlayerIds]);

  // 3-second auto-start countdown
  const [countdown, setCountdown] = useState<number | null>(null);

  const timerRef = useRef<any>(null);

  // Combined players list
  const players = useMemo(() => {
    const map = new Map<string, any>();
    (activeRoom?.players || []).forEach((p) => {
      if (p.id !== 'host_tv') map.set(p.id, p);
    });
    broadcastPlayers.forEach((p) => {
      if (p.id !== 'host_tv') map.set(p.id, p);
    });
    return Array.from(map.values());
  }, [activeRoom?.players, broadcastPlayers]);

  const playersRef = useRef(players);
  useEffect(() => { playersRef.current = players; }, [players]);

  const joinUrl = `${window.location.origin}/join?code=${roomCode}`;

  // Safe Broadcast Helper using ref
  const broadcastEvent = async (event: string, payload: any) => {
    if (!channelRef.current || !isSubscribedRef.current) {
      console.warn(`[TV Scammer] Cannot broadcast ${event}: Channel not subscribed yet.`);
      return;
    }
    try {
      await channelRef.current.send({
        type: 'broadcast',
        event,
        payload
      });
    } catch (err) {
      console.warn(`[TV Scammer] Broadcast error for ${event}:`, err);
    }
  };

  // Channel Lifecycle (Strictly [roomCode] dependency)
  useEffect(() => {
    const normalizedCode = roomCode.trim().toUpperCase();
    const channelName = `scammer:${normalizedCode}`;

    if (channelRef.current) {
      console.log(`[TV Scammer] Removing existing channel before initialization: ${channelName}`);
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log(`[TV Scammer] Initializing channel: ${channelName}`);
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false, ack: false }
      }
    });

    channelRef.current = channel;

    // Listeners setup BEFORE subscribing
    channel
      .on('broadcast', { event: 'PLAYER_JOIN' }, ({ payload }) => {
        if (!payload?.player) return;
        setBroadcastPlayers((prev) => {
          if (prev.some((p) => p.id === payload.player.id)) return prev;
          return [...prev, payload.player];
        });
      })
      .on('broadcast', { event: 'PLAYER_READY_TOGGLE' }, ({ payload }) => {
        if (!payload?.playerId) return;
        sound.playClick();
        setReadyPlayerIds((prev) => {
          const next = new Set(prev);
          if (payload.isReady) {
            next.add(payload.playerId);
          } else {
            next.delete(payload.playerId);
          }
          readyPlayerIdsRef.current = next;

          if (channelRef.current && isSubscribedRef.current) {
            channelRef.current.send({
              type: 'broadcast',
              event: 'PLAYER_READY_LIST',
              payload: { readyPlayerIds: Array.from(next) }
            }).catch(() => {});
          }
          return next;
        });
      })
      .on('broadcast', { event: 'REQUEST_ROOM_STATE' }, () => {
        if (!channelRef.current || !isSubscribedRef.current) return;
        const syncPayload = {
          phase: phaseRef.current,
          currentProduct: currentProductRef.current,
          timeLeft: timeLeftRef.current,
          negotiations: negotiationsRef.current,
          winner: winnerRef.current,
          readyPlayerIds: Array.from(readyPlayerIdsRef.current)
        };
        channelRef.current.send({
          type: 'broadcast',
          event: 'SCAMMER_ROOM_STATE_SYNC',
          payload: syncPayload
        }).catch(() => {});
      })
      .on('broadcast', { event: 'PLAYER_BID_UPDATE' }, ({ payload }) => {
        if (!payload?.playerId) return;
        sound.playTick();
        setNegotiations((prev) => {
          const updated = {
            ...prev,
            [payload.playerId]: {
              playerId: payload.playerId,
              playerName: payload.playerName || 'بياع',
              currentBid: typeof payload.currentBid === 'number' ? payload.currentBid : 0,
              messages: Array.isArray(payload.messages) ? payload.messages : [],
              botFinalRoast: payload.botFinalRoast || ''
            }
          };
          negotiationsRef.current = updated;
          return updated;
        });
      });

    // Subscribe ONCE
    channel.subscribe((status) => {
      console.log(`[TV Scammer Channel]: ${status}`);
      if (status === 'SUBSCRIBED') {
        isSubscribedRef.current = true;
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        isSubscribedRef.current = false;
      }
    });

    return () => {
      console.log(`[TV Scammer] Cleaning up channel: ${channelName}`);
      isSubscribedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomCode]);

  // Reactive Auto-Start 3-second Countdown (when readyPlayerIds.size >= 2)
  useEffect(() => {
    if (phase !== 'LOBBY') {
      setCountdown(null);
      return;
    }

    if (readyPlayerIds.size >= 2) {
      if (countdown === null) {
        setCountdown(3);
      }
    } else {
      setCountdown(null);
    }
  }, [readyPlayerIds.size, phase]);

  // Countdown ticker
  useEffect(() => {
    if (countdown === null || phase !== 'LOBBY') return;

    if (countdown === 0) {
      startProductRevealPhase();
      setCountdown(null);
      return;
    }

    const timer = setTimeout(() => {
      sound.playTick();
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, phase]);

  // General Timer Tick for PRODUCT_REVEAL and NEGOTIATION_CHAT
  useEffect(() => {
    if (timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        if (prev <= 6) {
          sound.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft]);

  // Transition from PRODUCT_REVEAL to NEGOTIATION_CHAT
  useEffect(() => {
    if (phase === 'PRODUCT_REVEAL' && timeLeft === 0) {
      startNegotiationChatPhase();
    }
  }, [phase, timeLeft]);

  // Transition from NEGOTIATION_CHAT to SHOWCASE_TRANSCRIPT
  useEffect(() => {
    if (phase === 'NEGOTIATION_CHAT' && timeLeft === 0) {
      concludeNegotiationAndShowcase();
    }
  }, [phase, timeLeft]);

  // Phase Transition Functions
  const startProductRevealPhase = () => {
    sound.playClick();
    // Pick a random product
    const randomIndex = Math.floor(Math.random() * WEIRD_PRODUCTS_BANK.length);
    const chosenProduct = WEIRD_PRODUCTS_BANK[randomIndex];
    setCurrentProduct(chosenProduct);
    currentProductRef.current = chosenProduct;

    // Reset negotiations
    const initialNegs: Record<string, PlayerNegotiation> = {};
    playersRef.current.forEach((p) => {
      initialNegs[p.id] = {
        playerId: p.id,
        playerName: p.name,
        currentBid: 0,
        messages: []
      };
    });
    setNegotiations(initialNegs);
    negotiationsRef.current = initialNegs;
    setWinner(null);
    winnerRef.current = null;
    setCountdown(null);

    setPhase('PRODUCT_REVEAL');
    phaseRef.current = 'PRODUCT_REVEAL';
    setTimeLeft(REVEAL_DURATION);

    broadcastEvent('SCAMMER_PHASE_CHANGE', {
      phase: 'PRODUCT_REVEAL',
      product: chosenProduct,
      duration: REVEAL_DURATION
    });
  };

  const startNegotiationChatPhase = () => {
    sound.playClick();
    setPhase('NEGOTIATION_CHAT');
    phaseRef.current = 'NEGOTIATION_CHAT';
    setTimeLeft(NEGOTIATION_DURATION);

    broadcastEvent('SCAMMER_PHASE_CHANGE', {
      phase: 'NEGOTIATION_CHAT',
      product: currentProductRef.current,
      duration: NEGOTIATION_DURATION
    });
  };

  const concludeNegotiationAndShowcase = () => {
    sound.playVictory();
    // Calculate highest bidder
    const negList = Object.values(negotiationsRef.current);
    const sorted = [...negList].sort((a, b) => b.currentBid - a.currentBid);
    const topBidder = sorted[0] || {
      playerId: 'none',
      playerName: 'لا يوجد',
      currentBid: 0,
      messages: []
    };

    setWinner(topBidder);
    winnerRef.current = topBidder;

    setPhase('SHOWCASE_TRANSCRIPT');
    phaseRef.current = 'SHOWCASE_TRANSCRIPT';

    broadcastEvent('SCAMMER_PHASE_CHANGE', {
      phase: 'SHOWCASE_TRANSCRIPT',
      winner: topBidder,
      negotiations: negotiationsRef.current
    });
  };

  const goToPodium = () => {
    sound.playClick();
    setPhase('PODIUM');
    phaseRef.current = 'PODIUM';

    broadcastEvent('SCAMMER_PHASE_CHANGE', {
      phase: 'PODIUM',
      winner: winnerRef.current,
      negotiations: negotiationsRef.current
    });
  };

  const resetToLobby = () => {
    sound.playClick();
    setPhase('LOBBY');
    phaseRef.current = 'LOBBY';
    setReadyPlayerIds(new Set());
    readyPlayerIdsRef.current = new Set();
    setCountdown(null);
    setNegotiations({});
    negotiationsRef.current = {};
    setWinner(null);
    winnerRef.current = null;

    broadcastEvent('RETURN_TO_LOBBY', {});
  };

  const handleKickPlayer = (targetPlayerId: string) => {
    sound.playClick();
    broadcastEvent('KICK_PLAYER', { playerId: targetPlayerId });
    setBroadcastPlayers((prev) => prev.filter((p) => p.id !== targetPlayerId));
    setReadyPlayerIds((prev) => {
      const next = new Set(prev);
      next.delete(targetPlayerId);
      return next;
    });
    roomBus.kickPlayer(roomCode, targetPlayerId);
  };

  // Sorted list of players by current bid
  const sortedNegotiations = useMemo(() => {
    return Object.values(negotiations).sort((a, b) => b.currentBid - a.currentBid);
  }, [negotiations]);

  const handleTerminateAuction = async () => {
    sound.playClick();
    // Broadcast kick all & game termination to all connected mobile clients
    await broadcastEvent('KICK_ALL_PLAYERS', { roomCode });
    await broadcastEvent('GAME_TERMINATED', { roomCode });

    try {
      const roomChannelName = `room:${roomCode.trim().toUpperCase()}`;
      const roomChannel = supabase.channel(roomChannelName);
      await roomChannel.send({
        type: 'broadcast',
        event: 'GAME_TERMINATED',
        payload: { roomCode }
      });
      await roomChannel.send({
        type: 'broadcast',
        event: 'KICK_ALL_PLAYERS',
        payload: { roomCode }
      });
    } catch (e) {
      console.warn('[Terminate room error]:', e);
    }

    // Clear room bus state & players
    const r = roomBus.getRoom(roomCode);
    if (r) {
      r.players = [];
      roomBus.saveRoom(r);
    }

    // Navigate host TV back to home
    navigate('/');
  };

  if (phase === 'LOBBY') {
    return (
      <UnifiedShabahLobby
        roomCode={roomCode}
        gameId="the-scammer"
        gameTitle="شبح الشريطي"
        players={players.map((p) => ({
          id: p.id,
          name: p.name,
          isReady: readyPlayerIds.has(p.id),
        }))}
        role="host"
        onStartGame={startProductRevealPhase}
        onKickPlayer={handleKickPlayer}
        onExit={handleTerminateAuction}
        minPlayers={1}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col font-sans select-none overflow-x-hidden" dir="rtl">
      <ScammerTopBar
        roomCode={roomCode}
        phase={phase}
        onReturnToLobby={resetToLobby}
        onLeaveRoom={handleTerminateAuction}
        isHost={true}
      />

      <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-6xl w-full mx-auto">
        {/* PHASE 1: LOBBY */}
        {false && (
          <div className="w-full flex flex-col items-center gap-8 text-center my-auto">
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 bg-[#8A9A5B]/20 border-2 border-[#2C2A29] rounded-2xl flex items-center justify-center">
                <Gavel className="text-[#8A9A5B]" size={36} />
              </div>
              <h1 className="text-4xl font-black text-[#2C2A29] tracking-tight">النصاب</h1>
              <p className="text-sm text-[#5C4033] font-bold">
                حراج الأعذار والتفاوض مع الزبون الشريطي!
              </p>
            </div>

            {/* Lobby Centerpiece: 2 Columns (Compact QR Box + How to Play Card) */}
            <div className="max-w-4xl mx-auto w-full px-2" dir="rtl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch w-full">
                {/* Column 1: Compact QR Box */}
                <div className="flex flex-col items-center justify-center bg-[#F7F4EC] p-5 rounded-2xl border-2 border-[#2C2A29] shadow-[5px_5px_0px_#2C2A29]">
                  <div className="bg-white p-3 border-2 border-[#2C2A29] rounded-xl mb-3 shadow-[2px_2px_0px_#2C2A29]">
                    <QRCodeSVG level="H" size={140} value={joinUrl} />
                  </div>
                  <span className="text-xs font-bold text-[#5C4033] mb-1">امسح للدخول بالجوال</span>
                  <div className="bg-[#E5E0D5] border-2 border-[#2C2A29] px-4 py-1.5 rounded-xl shadow-[2px_2px_0px_#2C2A29]">
                    <span className="text-xl font-black tracking-widest text-[#2C2A29]">{roomCode}</span>
                  </div>
                </div>

                {/* Column 2: How to Play (شرح اللعبة) Card */}
                <div className="bg-[#F7F4EC] p-5 rounded-2xl border-2 border-[#2C2A29] shadow-[5px_5px_0px_#2C2A29] flex flex-col justify-between text-right">
                  <div>
                    <div className="flex items-center gap-2 mb-3 border-b-2 border-[#2C2A29]/15 pb-2">
                      <span className="text-lg">📜</span>
                      <h3 className="text-base font-black text-[#2C2A29]">طريقة لعب "النصاب":</h3>
                    </div>
                    <ul className="space-y-2.5 text-xs font-bold text-[#2C2A29]">
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#8A9A5B] text-white flex items-center justify-center font-black flex-shrink-0 text-[10px]">1</span>
                        <span>الكل ينعرض عليه <strong>نفس السلعة الخربانة</strong> وعيبها الفادح.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#8A9A5B] text-white flex items-center justify-center font-black flex-shrink-0 text-[10px]">2</span>
                        <span>تدخل شات تفاوض (1 ضد 1) مع <strong>زبون وشريطي داهية</strong> معه كاش وما يرحم.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#8A9A5B] text-white flex items-center justify-center font-black flex-shrink-0 text-[10px]">3</span>
                        <span>ارقع العيوب بذكاء عشان <strong>ترفع سومة الزبون بالريال</strong>، وانتبه يكشف كذبك!</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#C68B59] text-white flex items-center justify-center font-black flex-shrink-0 text-[10px]">4</span>
                        <span>صاحب <strong>أعلى سومة معتمدة</strong> يفوز وتنعرض محادثته كاملة بالتلفزيون!</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-4 pt-2 border-t border-[#2C2A29]/10 text-center">
                    <span className="text-[11px] font-black text-[#8A9A5B]">مدة المزاد: دقيقتين ونصف (150 ثانية) ⏱️</span>
                  </div>
                </div>
              </div>

              {/* Auto Countdown Banner when >= 2 ready */}
              {countdown !== null ? (
                <div className="mt-6 bg-[#8A9A5B] text-white px-8 py-3 rounded-2xl border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] text-center">
                  <span className="text-lg font-black">
                    اكتمل النصاب! ينطلق الحراج خلال {countdown}...
                  </span>
                </div>
              ) : (
                <div className="mt-4 text-xs font-black text-[#5C4033] bg-[#F7F4EC] border-2 border-[#2C2A29] px-4 py-2 rounded-xl text-center shadow-[2px_2px_0px_#2C2A29]">
                  {readyPlayerIds.size >= 2
                    ? 'اكتمل النصاب! جاري التجهيز...'
                    : 'في انتظار جاهزية متسابقَين اثنين على الأقل لبدء العد التنازلي'}
                </div>
              )}
            </div>

            {/* Joined Players Grid with Kick (×) Button */}
            <div className="w-full max-w-4xl">
              <div className="flex items-center justify-between mb-3 px-2">
                <span className="text-sm font-black text-[#2C2A29] flex items-center gap-2">
                  <Users size={18} className="text-[#8A9A5B]" />
                  <span>المتسابقون في الحراج ({players.length})</span>
                </span>
                {players.length >= 2 && countdown === null && (
                  <button
                    onClick={startProductRevealPhase}
                    className="flex items-center gap-1.5 bg-[#8A9A5B] text-white border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] px-4 py-1.5 rounded-xl font-black text-xs hover:bg-[#2C2A29] active:translate-y-0.5 cursor-pointer"
                  >
                    <Play size={14} />
                    <span>بدء الحراج الآن</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {players.map((p) => {
                  const isReady = readyPlayerIds.has(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`relative flex items-center justify-between p-3 rounded-xl border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] ${
                        isReady ? 'bg-[#8A9A5B]/20' : 'bg-[#F7F4EC]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-3 h-3 rounded-full border border-[#2C2A29] shrink-0 bg-[#8A9A5B]" />
                        <span className="text-xs font-black text-[#2C2A29] truncate">{p.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-black border border-[#2C2A29] ${
                            isReady ? 'bg-[#8A9A5B] text-white' : 'bg-[#E5E0D5] text-[#2C2A29]'
                          }`}
                        >
                          {isReady ? 'جاهز' : 'ينتظر'}
                        </span>
                        <button
                          onClick={() => handleKickPlayer(p.id)}
                          title="استبعاد المتسابق"
                          className="w-5 h-5 flex items-center justify-center bg-[#B85C5C] text-white rounded-md border border-[#2C2A29] hover:bg-[#2C2A29] cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* PHASE 2: PRODUCT_REVEAL */}
        {phase === 'PRODUCT_REVEAL' && (
          <div className="w-full max-w-3xl flex flex-col items-center gap-6 text-center my-auto">
            <div className="flex items-center justify-between w-full bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl px-6 py-3">
              <span className="font-black text-sm text-[#5C4033]">معاينة السلعة المعروضة</span>
              <div className="flex items-center gap-2 font-black text-lg text-[#C68B59]">
                <Clock size={20} />
                <span>يبدأ التفاوض خلال {timeLeft} ثانية</span>
              </div>
            </div>

            <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[8px_8px_0px_#2C2A29] rounded-3xl p-8 w-full flex flex-col gap-6 text-right">
              <div className="flex items-center justify-between border-b-2 border-[#2C2A29] pb-4">
                <span className="text-xs font-black bg-[#C68B59] text-white px-3 py-1 rounded-full border border-[#2C2A29]">
                  سلعة نادرة في الحراج
                </span>
                <span className="text-xs font-black text-[#5C4033]">جولة واحدة فقط</span>
              </div>

              <div>
                <h2 className="text-3xl sm:text-4xl font-black text-[#2C2A29] mb-3">
                  {currentProduct.name}
                </h2>
                <p className="text-base text-[#5C4033] font-bold leading-relaxed">
                  {currentProduct.description}
                </p>
              </div>

              {/* Fatal Flaw Box */}
              <div className="bg-[#B85C5C]/15 border-2 border-[#B85C5C] shadow-[4px_4px_0px_#B85C5C] rounded-2xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#B85C5C] text-white flex items-center justify-center shrink-0 border border-[#2C2A29]">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <span className="text-xs font-black text-[#B85C5C] block mb-1">
                    العيب الفادح في السلعة:
                  </span>
                  <span className="text-sm font-black text-[#2C2A29]">
                    {currentProduct.flaw}
                  </span>
                </div>
              </div>

              <div className="bg-white border-2 border-[#2C2A29] rounded-xl p-4 text-center">
                <p className="text-xs font-black text-[#2C2A29]">
                  جهّزوا أعذاركم وترقيعاتكم على الجوال.. الشريطي جاي ومعاه كاش وما يرحم!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PHASE 3: NEGOTIATION_CHAT (Live Bidding Board) */}
        {phase === 'NEGOTIATION_CHAT' && (
          <div className="w-full flex flex-col gap-6 my-auto">
            {/* Top Bar with circular-style timer and product reminder */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[6px_6px_0px_#2C2A29] rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#8A9A5B]/20 border-2 border-[#2C2A29] rounded-xl flex items-center justify-center">
                  <Gavel className="text-[#8A9A5B]" size={26} />
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#5C4033] font-bold block">السلعة قيد التفاوض:</span>
                  <h3 className="text-xl font-black text-[#2C2A29]">{currentProduct.name}</h3>
                </div>
              </div>

              {/* 90-second circular countdown display */}
              <div className="flex items-center gap-3 bg-white border-2 border-[#2C2A29] px-6 py-2.5 rounded-2xl shadow-[3px_3px_0px_#2C2A29]">
                <Clock className="text-[#C68B59]" size={24} />
                <div className="text-center">
                  <span className="text-2xl font-black text-[#2C2A29] tabular-nums">{timeLeft}</span>
                  <span className="text-[11px] text-[#5C4033] font-bold mr-1">ثانية متبقية</span>
                </div>
              </div>
            </div>

            {/* Live Bidding Board */}
            <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[8px_8px_0px_#2C2A29] rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4 border-b-2 border-[#2C2A29] pb-3">
                <span className="font-black text-base text-[#2C2A29] flex items-center gap-2">
                  <TrendingUp size={20} className="text-[#8A9A5B]" />
                  <span>لوحة السوم اللحظية (بالريال)</span>
                </span>
                <span className="text-xs text-[#5C4033] font-bold">
                  أعلى سومة تنعرض محادثتها على الشاشة كاملة!
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {sortedNegotiations.map((neg, idx) => {
                  const isLeading = idx === 0 && neg.currentBid > 0;
                  return (
                    <div
                      key={neg.playerId}
                      className={`relative p-4 rounded-2xl border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] flex flex-col justify-between gap-3 text-right ${
                        isLeading ? 'bg-[#8A9A5B]/20 border-[#8A9A5B]' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black border border-[#2C2A29] ${
                              idx === 0
                                ? 'bg-[#C68B59] text-white'
                                : idx === 1
                                ? 'bg-[#E5E0D5] text-[#2C2A29]'
                                : 'bg-[#F7F4EC] text-[#5C4033]'
                            }`}
                          >
                            #{idx + 1}
                          </span>
                          <span className="font-black text-sm text-[#2C2A29] truncate max-w-[120px]">
                            {neg.playerName}
                          </span>
                        </div>
                        {isLeading && (
                          <span className="flex items-center gap-1 bg-[#8A9A5B] text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-[#2C2A29]">
                            <Crown size={12} />
                            <span>المتصدر</span>
                          </span>
                        )}
                      </div>

                      <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] rounded-xl p-3 text-center">
                        <span className="text-[10px] text-[#5C4033] font-bold block mb-0.5">السومة الحالية:</span>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-2xl font-black text-[#2C2A29] tabular-nums">
                            {neg.currentBid}
                          </span>
                          <span className="text-xs font-bold text-[#5C4033]">ريال</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-bold text-[#5C4033]">
                        <span className="flex items-center gap-1">
                          <MessageSquare size={12} />
                          <span>{neg.messages.length} رسائل</span>
                        </span>
                        <span className="text-[#8A9A5B] font-black">
                          {neg.currentBid > 0 ? 'نجح بالإقناع' : 'يفاوض...'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* PHASE 4: SHOWCASE_TRANSCRIPT (The Climax) */}
        {phase === 'SHOWCASE_TRANSCRIPT' && winner && (
          <div className="w-full flex flex-col gap-6 my-auto max-w-5xl">
            {/* Crown Banner */}
            <div className="bg-[#F7F4EC] border-2 border-[#8A9A5B] shadow-[6px_6px_0px_#8A9A5B] rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-right">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#8A9A5B]/20 border-2 border-[#8A9A5B] rounded-2xl flex items-center justify-center shrink-0">
                  <Crown className="text-[#8A9A5B]" size={36} />
                </div>
                <div>
                  <span className="text-xs font-black bg-[#8A9A5B] text-white px-3 py-1 rounded-full">
                    بطل الحراج وأكبر نصاب! (+10 pt)
                  </span>
                  <h2 className="text-3xl font-black text-[#2C2A29] mt-1">
                    {winner.playerName} انتزع أعلى سومة!
                  </h2>
                  <p className="text-xs text-[#5C4033] font-bold">
                    السلعة: {currentProduct.name} | السعر المعتمد: {winner.currentBid} ريال
                  </p>
                </div>
              </div>

              <button
                onClick={goToPodium}
                className="flex items-center gap-2 bg-[#8A9A5B] text-white border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] px-6 py-3 rounded-xl font-black text-sm hover:bg-[#2C2A29] active:translate-y-0.5 cursor-pointer shrink-0"
              >
                <Trophy size={18} />
                <span>منصة التتويج النهائية</span>
              </button>
            </div>

            {/* Grid Layout: Winning Chat Log (Prominent) + Other Competitors */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Winning Chat Log: Left 2 columns */}
              <div className="lg:col-span-2 bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[8px_8px_0px_#2C2A29] rounded-3xl p-6 flex flex-col gap-4 text-right">
                <div className="flex items-center justify-between border-b-2 border-[#2C2A29] pb-3">
                  <span className="font-black text-base text-[#2C2A29] flex items-center gap-2">
                    <MessageSquare size={18} className="text-[#8A9A5B]" />
                    <span>سجل محادثة {winner.playerName} مع الزبون الشريطي</span>
                  </span>
                  <span className="text-xs font-black bg-[#E5E0D5] border border-[#2C2A29] px-3 py-1 rounded-lg text-[#2C2A29]">
                    السعر النهائي: {winner.currentBid} ريال
                  </span>
                </div>

                {/* Scrollable Chat Bubbles */}
                <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto p-2">
                  {winner.messages.length > 0 ? (
                    winner.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[85%] ${
                          msg.sender === 'player' ? 'self-end items-end' : 'self-start items-start'
                        }`}
                      >
                        <span className="text-[10px] font-bold text-[#5C4033] mb-1">
                          {msg.sender === 'player' ? winner.playerName : 'الزبون الشريطي'}
                        </span>
                        <div
                          className={`p-3.5 rounded-2xl border-2 border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29] text-sm font-bold leading-relaxed ${
                            msg.sender === 'player'
                              ? 'bg-[#8A9A5B]/20 text-[#2C2A29] rounded-br-xs'
                              : 'bg-white text-[#2C2A29] rounded-bl-xs'
                          }`}
                        >
                          <p>{msg.text}</p>
                          {msg.sender === 'bot' && (
                            <div className="mt-2 pt-1 border-t border-[#2C2A29]/15 flex items-center gap-1 text-[11px] font-black text-[#8A9A5B]">
                              <span>السومة عندها: {msg.currentBid} ريال</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-xs font-bold text-[#5C4033]">
                      لم يتم تسجيل رسائل في هذه المحادثة
                    </div>
                  )}
                </div>
              </div>

              {/* Other Bidders Summary: Right column */}
              <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[6px_6px_0px_#2C2A29] rounded-3xl p-5 flex flex-col gap-3 text-right">
                <span className="font-black text-sm text-[#2C2A29] border-b-2 border-[#2C2A29] pb-2">
                  باقي البياعين في الحراج
                </span>

                <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto">
                  {sortedNegotiations
                    .filter((n) => n.playerId !== winner.playerId)
                    .map((neg, idx) => (
                      <div
                        key={neg.playerId}
                        className="bg-white border-2 border-[#2C2A29] rounded-xl p-3 flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xs text-[#2C2A29]">{neg.playerName}</span>
                          <span className="text-xs font-black text-[#C68B59] bg-[#E5E0D5] px-2 py-0.5 rounded border border-[#2C2A29]">
                            {neg.currentBid} ريال
                          </span>
                        </div>
                        {neg.botFinalRoast && (
                          <p className="text-[11px] font-bold text-[#5C4033] bg-[#F7F4EC] p-2 rounded-lg border border-[#2C2A29]/20 italic">
                            "{neg.botFinalRoast}"
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PHASE 5: PODIUM */}
        {phase === 'PODIUM' && (
          <div className="w-full max-w-2xl flex flex-col items-center gap-6 text-center my-auto">
            <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[8px_8px_0px_#2C2A29] rounded-3xl p-8 w-full flex flex-col items-center gap-6">
              <div className="w-20 h-20 bg-[#8A9A5B]/20 border-2 border-[#2C2A29] rounded-2xl flex items-center justify-center">
                <Trophy className="text-[#8A9A5B]" size={40} />
              </div>

              <div>
                <h2 className="text-3xl font-black text-[#2C2A29]">منصة تتويج الحراج</h2>
                <p className="text-sm text-[#5C4033] font-bold mt-1">
                  النتائج النهائية لحراج "{currentProduct.name}"
                </p>
              </div>

              {/* Leaderboard Table */}
              <div className="w-full flex flex-col gap-2.5 text-right">
                {sortedNegotiations.map((neg, idx) => {
                  const isFirst = idx === 0;
                  return (
                    <div
                      key={neg.playerId}
                      className={`border-2 border-[#2C2A29] rounded-2xl p-4 flex items-center justify-between font-black text-sm ${
                        isFirst
                          ? 'bg-[#8A9A5B]/20 border-[#8A9A5B] shadow-[4px_4px_0px_#8A9A5B]'
                          : 'bg-white shadow-[2px_2px_0px_#2C2A29]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black border-2 border-[#2C2A29] ${
                            idx === 0
                              ? 'bg-[#C68B59] text-white'
                              : idx === 1
                              ? 'bg-[#E5E0D5] text-[#2C2A29]'
                              : 'bg-[#F7F4EC] text-[#5C4033]'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-base text-[#2C2A29]">{neg.playerName}</span>
                        {isFirst && <Crown size={18} className="text-[#C68B59]" />}
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-xs text-[#5C4033]">
                          السومة: <span className="text-[#2C2A29] font-black">{neg.currentBid} ريال</span>
                        </span>
                        <span className="text-sm font-black text-[#8A9A5B]">
                          {isFirst ? '+10 pt' : '+1 pt'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={resetToLobby}
                className="w-full py-4 bg-[#8A9A5B] text-white border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-xl font-black text-base hover:bg-[#2C2A29] active:translate-y-0.5 cursor-pointer mt-2"
              >
                بدء حراج جديد
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
