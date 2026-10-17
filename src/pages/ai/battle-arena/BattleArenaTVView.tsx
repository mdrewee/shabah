// src/pages/ai/battle-arena/BattleArenaTVView.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  Swords,
  Shield,
  Zap,
  Users,
  Clock,
  Trophy,
  Check,
  X,
  Play,
  RotateCcw,
  Crown,
  Frown,
  Flame
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useRoom, roomBus } from '../../../lib/roomBus';
import { sound } from '../../../lib/audio';
import { BattleTopBar } from './components/BattleTopBar';
import {
  BattlePhase,
  PlayerLoadout,
  DuelClashResult,
  BattleScore
} from './types';

const LOADOUT_TIMER_SECONDS = 50;

interface BattleArenaTVViewProps {
  roomCode?: string;
}

export const BattleArenaTVView: React.FC<BattleArenaTVViewProps> = ({ roomCode: propRoomCode }) => {
  const params = useParams();
  const navigate = useNavigate();
  const roomCode = (propRoomCode || params.code || params.roomId || params.id || '').trim().toUpperCase() || 'TAQ1';

  const { room } = useRoom(roomCode);
  const activeRoom = room || roomBus.getRoom(roomCode);

  // Realtime Channel References (Strict Singleton Guard)
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef<boolean>(false);

  // Core Phase & Matchmaking State
  const [phase, setPhase] = useState<BattlePhase>('LOBBY');
  const phaseRef = useRef<BattlePhase>('LOBBY');
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const [timeLeft, setTimeLeft] = useState(0);
  const timeLeftRef = useRef(0);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  const [loadouts, setLoadouts] = useState<PlayerLoadout[]>([]);
  const loadoutsRef = useRef<PlayerLoadout[]>([]);
  useEffect(() => { loadoutsRef.current = loadouts; }, [loadouts]);

  // Tournament Duels & Bracket
  const [duelQueue, setDuelQueue] = useState<[PlayerLoadout, PlayerLoadout][]>([]);
  const duelQueueRef = useRef<[PlayerLoadout, PlayerLoadout][]>([]);
  useEffect(() => { duelQueueRef.current = duelQueue; }, [duelQueue]);

  const [currentDuelIndex, setCurrentDuelIndex] = useState(0);
  const currentDuelIndexRef = useRef(0);
  useEffect(() => { currentDuelIndexRef.current = currentDuelIndex; }, [currentDuelIndex]);

  const [currentResult, setCurrentResult] = useState<DuelClashResult | null>(null);
  const currentResultRef = useRef<DuelClashResult | null>(null);
  useEffect(() => { currentResultRef.current = currentResult; }, [currentResult]);

  const [isDeliberating, setIsDeliberating] = useState(false);

  // Scores Tracking
  const [scores, setScores] = useState<Record<string, BattleScore>>({});
  const scoresRef = useRef<Record<string, BattleScore>>({});
  useEffect(() => { scoresRef.current = scores; }, [scores]);

  // Broadcast joined players fallback
  const [broadcastPlayers, setBroadcastPlayers] = useState<any[]>([]);

  // Ready players tracking in Lobby
  const [readyPlayerIds, setReadyPlayerIds] = useState<Set<string>>(new Set());
  const readyPlayerIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => { readyPlayerIdsRef.current = readyPlayerIds; }, [readyPlayerIds]);

  // 3-second auto-start countdown
  const [countdown, setCountdown] = useState<number | null>(null);

  const timerRef = useRef<any>(null);

  // Combined players list (roomBus presence + broadcast PLAYER_JOIN)
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
      console.warn(`[TV Battle] Cannot broadcast ${event}: Channel not subscribed yet.`);
      return;
    }
    try {
      await channelRef.current.send({
        type: 'broadcast',
        event,
        payload
      });
    } catch (err) {
      console.warn(`[TV Battle] Broadcast error for ${event}:`, err);
    }
  };

  // Helper for incoming loadouts
  const handleIncomingLoadout = (payload: any) => {
    if (!payload?.playerId) return;
    sound.playClick();
    setLoadouts((prev) => {
      const filtered = prev.filter((l) => l.playerId !== payload.playerId);
      const updated = [
        ...filtered,
        {
          playerId: payload.playerId,
          playerName: payload.playerName || 'مصارع',
          weapon: payload.weapon || 'قبضة حديدية',
          defense: payload.defense || 'تفادي بهلواني',
          superpower: payload.superpower || 'صدمة غير متوقعة'
        }
      ];
      loadoutsRef.current = updated;
      return updated;
    });
  };

  // Definitive Stable Channel Lifecycle (Strictly [roomCode] dependency)
  useEffect(() => {
    const normalizedCode = roomCode.trim().toUpperCase();
    const channelName = `battle:${normalizedCode}`;

    if (channelRef.current) {
      console.log(`[TV Battle] Removing existing channel before initialization: ${channelName}`);
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log(`[TV Battle] Initializing channel: ${channelName}`);
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
        const currentDuel = duelQueueRef.current[currentDuelIndexRef.current] || null;
        const syncPayload = {
          phase: phaseRef.current,
          timeLeft: timeLeftRef.current,
          loadouts: loadoutsRef.current,
          currentDuel,
          currentResult: currentResultRef.current,
          scores: scoresRef.current,
          readyPlayerIds: Array.from(readyPlayerIdsRef.current)
        };
        channelRef.current.send({
          type: 'broadcast',
          event: 'BATTLE_ROOM_STATE_SYNC',
          payload: syncPayload
        }).catch(() => {});
      })
      .on('broadcast', { event: 'SUBMIT_LOADOUT' }, ({ payload }) => {
        handleIncomingLoadout(payload);
      });

    // Subscribe ONCE with safe status logging
    channel.subscribe((status) => {
      console.log(`[TV Battle Channel]: ${status}`);
      if (status === 'SUBSCRIBED') {
        isSubscribedRef.current = true;
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        isSubscribedRef.current = false;
      }
    });

    return () => {
      console.log(`[TV Battle] Cleaning up channel: ${channelName}`);
      isSubscribedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomCode]); // ONLY roomCode in dependency array!

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
      startLoadoutInputPhase(true);
      setCountdown(null);
      return;
    }

    const timer = setTimeout(() => {
      sound.playTick();
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, phase]);

  // Timer for LOADOUT_INPUT
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

  // Auto-advance logic for LOADOUT_INPUT
  useEffect(() => {
    if (phase === 'LOADOUT_INPUT') {
      const activePlayers = playersRef.current;
      const allSubmitted = activePlayers.length > 0 && loadouts.length >= activePlayers.length;
      if (allSubmitted || timeLeft === 0) {
        buildBracketAndStartMatchmaking();
      }
    }
  }, [phase, timeLeft, loadouts.length]);

  // Phase transitions
  const startLoadoutInputPhase = (isNewTournament = false) => {
    sound.playClick();
    if (isNewTournament) {
      setScores({});
      scoresRef.current = {};
    }

    setLoadouts([]);
    loadoutsRef.current = [];
    setDuelQueue([]);
    duelQueueRef.current = [];
    setCurrentDuelIndex(0);
    currentDuelIndexRef.current = 0;
    setCurrentResult(null);
    currentResultRef.current = null;
    setCountdown(null);

    setPhase('LOADOUT_INPUT');
    phaseRef.current = 'LOADOUT_INPUT';
    setTimeLeft(LOADOUT_TIMER_SECONDS);

    broadcastEvent('BATTLE_PHASE_CHANGE', {
      phase: 'LOADOUT_INPUT',
      duration: LOADOUT_TIMER_SECONDS
    });
  };

  // Build 1v1 matchups from players/loadouts
  const buildBracketAndStartMatchmaking = () => {
    sound.playClick();

    // Auto-fill missing loadouts with funny defaults
    const currentList = [...loadoutsRef.current];
    playersRef.current.forEach((p) => {
      if (!currentList.some((l) => l.playerId === p.id)) {
        currentList.push({
          playerId: p.id,
          playerName: p.name,
          weapon: 'نعال زنوبة طائرة',
          defense: 'كيس بصل للتستر',
          superpower: 'يتنح ويغمض عيونه إذا خاف'
        });
      }
    });
    setLoadouts(currentList);
    loadoutsRef.current = currentList;

    // Shuffle and pair up in 1v1 duels
    const shuffled = [...currentList].sort(() => Math.random() - 0.5);
    const pairs: [PlayerLoadout, PlayerLoadout][] = [];

    for (let i = 0; i < shuffled.length; i += 2) {
      if (i + 1 < shuffled.length) {
        pairs.push([shuffled[i], shuffled[i + 1]]);
      } else {
        // Odd number of players: pair with a legendary AI dummy fighter
        pairs.push([
          shuffled[i],
          {
            playerId: 'bot_challenger',
            playerName: 'الشمري بطل الحارة',
            weapon: 'عصا مكنسة مكسورة',
            defense: 'درع طاسة شوربة',
            superpower: 'يصارخ ويفزع الحارة كلها'
          }
        ]);
      }
    }

    setDuelQueue(pairs);
    duelQueueRef.current = pairs;
    setCurrentDuelIndex(0);
    currentDuelIndexRef.current = 0;

    setPhase('MATCHMAKING_TREE');
    phaseRef.current = 'MATCHMAKING_TREE';

    broadcastEvent('BATTLE_PHASE_CHANGE', {
      phase: 'MATCHMAKING_TREE',
      duelQueue: pairs
    });
  };

  // Launch a 1v1 Duel Clash
  const launchCurrentDuel = async () => {
    sound.playClick();
    const pairs = duelQueueRef.current;
    const idx = currentDuelIndexRef.current;
    const currentDuel = pairs[idx];
    if (!currentDuel) return;

    setPhase('DUEL_CLASH');
    phaseRef.current = 'DUEL_CLASH';
    setIsDeliberating(true);
    setCurrentResult(null);
    currentResultRef.current = null;

    broadcastEvent('BATTLE_PHASE_CHANGE', {
      phase: 'DUEL_CLASH',
      currentDuel,
      duelNumber: idx + 1,
      totalDuels: pairs.length
    });

    try {
      const response = await supabase.functions.invoke('battle-clash', {
        body: {
          fighterA: currentDuel[0],
          fighterB: currentDuel[1]
        }
      });

      if (response.error || !response.data) {
        throw response.error || new Error('No clash result returned');
      }

      const res = response.data;
      const clashResult: DuelClashResult = {
        fighterA: currentDuel[0],
        fighterB: currentDuel[1],
        winnerPlayerId: res.winnerPlayerId || currentDuel[0].playerId,
        winnerName: res.winnerName || currentDuel[0].playerName,
        clashStory: res.clashStory || 'اشتباك عنيف أسفر عن فوز ساحق!',
        decidingFactor: res.decidingFactor || 'تفوق تكتيكي في استخدام العتاد!'
      };

      handleDuelResolved(clashResult);
    } catch (err) {
      console.warn('[AI Clash Invocation Error, using fallback]:', err);
      const clashResult: DuelClashResult = {
        fighterA: currentDuel[0],
        fighterB: currentDuel[1],
        winnerPlayerId: currentDuel[0].playerId,
        winnerName: currentDuel[0].playerName,
        clashStory: `اندفع ${currentDuel[0].playerName} بـ ${currentDuel[0].weapon} محاولاً كسر دفاع ${currentDuel[1].defense}. في اللحظة الحاسمة فاجأه بقوة "${currentDuel[0].superpower}" وحسم النزال بضربة أسقطت الخصم أرضاً!`,
        decidingFactor: `تنسيق هجومي غير متوقع باغث دفاع الخصم!`
      };
      handleDuelResolved(clashResult);
    } finally {
      setIsDeliberating(false);
    }
  };

  const handleDuelResolved = (clashResult: DuelClashResult) => {
    sound.playVictory();
    setCurrentResult(clashResult);
    currentResultRef.current = clashResult;

    // Scoring: Winner (+5 pt), Loser (+1 pt consolation)
    const updatedScores = { ...scoresRef.current };
    const winId = clashResult.winnerPlayerId;
    const loseId = winId === clashResult.fighterA.playerId ? clashResult.fighterB.playerId : clashResult.fighterA.playerId;

    const winPrev = updatedScores[winId] || {
      playerId: winId,
      playerName: clashResult.winnerName,
      wins: 0,
      totalScore: 0
    };
    updatedScores[winId] = {
      ...winPrev,
      wins: winPrev.wins + 1,
      totalScore: winPrev.totalScore + 5
    };

    if (loseId && loseId !== 'bot_challenger') {
      const loserName = loseId === clashResult.fighterA.playerId ? clashResult.fighterA.playerName : clashResult.fighterB.playerName;
      const losePrev = updatedScores[loseId] || {
        playerId: loseId,
        playerName: loserName,
        wins: 0,
        totalScore: 0
      };
      updatedScores[loseId] = {
        ...losePrev,
        totalScore: losePrev.totalScore + 1
      };
    }

    setScores(updatedScores);
    scoresRef.current = updatedScores;

    setPhase('DUEL_RESULT');
    phaseRef.current = 'DUEL_RESULT';

    broadcastEvent('BATTLE_DUEL_RESULT', {
      phase: 'DUEL_RESULT',
      clashResult,
      scores: updatedScores
    });
  };

  // Next duel or podium
  const handleNextDuel = () => {
    sound.playClick();
    const nextIdx = currentDuelIndex + 1;
    if (nextIdx < duelQueue.length) {
      setCurrentDuelIndex(nextIdx);
      currentDuelIndexRef.current = nextIdx;
      setCurrentResult(null);
      currentResultRef.current = null;
      launchCurrentDuel();
    } else {
      // Tournament Finished -> Transition to TOURNAMENT_PODIUM
      setPhase('TOURNAMENT_PODIUM');
      phaseRef.current = 'TOURNAMENT_PODIUM';

      broadcastEvent('BATTLE_PHASE_CHANGE', {
        phase: 'TOURNAMENT_PODIUM',
        scores: scoresRef.current
      });
    }
  };

  const handleKickPlayer = (targetPlayerId: string) => {
    broadcastEvent('KICK_PLAYER', { playerId: targetPlayerId });
    roomBus.kickPlayer(roomCode, targetPlayerId);
    setBroadcastPlayers((prev) => prev.filter((p) => p.id !== targetPlayerId));
    setReadyPlayerIds((prev) => {
      const next = new Set(prev);
      next.delete(targetPlayerId);
      return next;
    });
  };

  const handleReturnToLobby = () => {
    sound.playClick();
    setPhase('LOBBY');
    phaseRef.current = 'LOBBY';
    setLoadouts([]);
    loadoutsRef.current = [];
    setDuelQueue([]);
    duelQueueRef.current = [];
    setCurrentResult(null);
    currentResultRef.current = null;
    setReadyPlayerIds(new Set());
    setCountdown(null);
    broadcastEvent('RETURN_TO_LOBBY', {});
  };

  const handleLeaveRoom = () => {
    navigate('/');
  };

  const sortedLeaderboard = Object.values(scores).sort((a, b) => b.totalScore - a.totalScore);
  const grandChampion = sortedLeaderboard[0];
  const lowestFighter = sortedLeaderboard.length > 1 ? sortedLeaderboard[sortedLeaderboard.length - 1] : null;
  const currentDuel = duelQueue[currentDuelIndex];

  return (
    <div className="w-full h-screen bg-[#E5E0D5] bg-grain flex flex-col justify-between overflow-hidden font-sans select-none" dir="rtl">
      {/* TopBar with strict ochre buttons */}
      <BattleTopBar
        roomCode={roomCode}
        phase={phase}
        onReturnToLobby={handleReturnToLobby}
        onLeaveRoom={handleLeaveRoom}
        isHost={true}
      />

      {/* Main Screen Content */}
      <main className="flex-1 p-6 flex flex-col justify-center items-center overflow-hidden">
        {/* 1. LOBBY PHASE */}
        {phase === 'LOBBY' && (
          <div className="w-full max-w-4xl flex flex-col items-center">
            {/* Header Title */}
            <div className="flex items-center gap-3 bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] px-6 py-2.5 rounded-2xl mb-4">
              <Swords className="text-[#8A9A5B]" size={32} />
              <div>
                <h1 className="text-2xl font-black text-[#2C2A29]">حرب المصارعة</h1>
                <p className="text-xs font-bold text-[#5C4033]">
                  تحدي تصادم العتاد والقوى.. والـ AI يحلل النزال بدون هيلث بار!
                </p>
              </div>
            </div>

            {/* Centered QR Code & Room Code */}
            <div className="flex flex-col items-center justify-center my-2">
              <div className="bg-white p-4 border-2 border-[#2C2A29] shadow-[6px_6px_0px_#2C2A29] rounded-2xl mb-3">
                <QRCodeSVG value={joinUrl} size={190} level="H" />
              </div>
              <div className="text-center">
                <span className="text-xs font-bold text-[#5C4033] block mb-1">
                  امسح الباركود للانضمام بالجوال
                </span>
                <div className="inline-block bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] px-6 py-2 rounded-xl">
                  <span className="text-3xl font-black tracking-widest text-[#2C2A29]">{roomCode}</span>
                </div>
              </div>
            </div>

            {/* Auto Countdown Alert Banner */}
            {countdown !== null && (
              <div className="mt-2 mb-3 bg-[#8A9A5B] text-white px-6 py-3 rounded-2xl border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] text-center">
                <span className="text-xl font-black">
                  اكتمل النصاب! تبدأ الحلبة خلال {countdown}...
                </span>
              </div>
            )}

            {/* Players List with Kick & Ready status */}
            <div className="w-full bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl p-4 mb-4">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-sm font-black text-[#2C2A29]">
                  المصارعين في الحلبة ({players.length}) — الجاهزون ({readyPlayerIds.size})
                </span>
                <span className="text-xs font-bold text-[#5C4033]">
                  (الحد الأدنى للبدء التلقائي: 2 جاهزون)
                </span>
              </div>

              <div className="flex flex-wrap gap-2.5 min-h-[46px] items-center">
                {players.map((p) => {
                  const isReady = readyPlayerIds.has(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center gap-2 border-2 border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29] px-3.5 py-1.5 rounded-xl transition-all ${
                        isReady ? 'bg-[#8A9A5B] text-white' : 'bg-white text-[#2C2A29]'
                      }`}
                    >
                      {isReady && <Check size={14} className="stroke-[3]" />}
                      <span className="text-sm font-black">{p.name}</span>
                      <button
                        onClick={() => handleKickPlayer(p.id)}
                        title="طرد المصارع"
                        className="text-[#C68B59] hover:text-[#2C2A29] p-0.5 rounded cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
                {players.length === 0 && (
                  <p className="text-xs font-bold text-[#5C4033]/70">بانتظار دخول المصارعين عبر الجوال...</p>
                )}
              </div>
            </div>

            {/* Manual Start Button */}
            <button
              onClick={() => startLoadoutInputPhase(true)}
              disabled={players.length < 2}
              className={`px-8 py-3.5 rounded-xl border-2 border-[#2C2A29] font-black text-lg shadow-[4px_4px_0px_#2C2A29] transition-all active:translate-y-0.5 ${
                players.length >= 2
                  ? 'bg-[#8A9A5B] text-white hover:bg-[#2C2A29] cursor-pointer'
                  : 'bg-[#E5E0D5] text-[#2C2A29]/40 border-[#2C2A29]/30 shadow-none cursor-not-allowed'
              }`}
            >
              فتح أبواب الحلبة فوراً
            </button>
          </div>
        )}

        {/* 2. LOADOUT INPUT PHASE (50s) */}
        {phase === 'LOADOUT_INPUT' && (
          <div className="w-full max-w-4xl flex flex-col items-center">
            <div className="flex justify-between items-center w-full mb-4">
              <span className="text-sm font-black bg-[#C68B59] text-white px-3 py-1 rounded-xl border border-[#2C2A29]">
                مرحلة تسليح العتاد
              </span>
              <div className="flex items-center gap-1.5 text-base font-black bg-[#F7F4EC] border-2 border-[#2C2A29] px-4 py-1.5 rounded-xl">
                <Clock size={18} />
                <span className={timeLeft <= 10 ? 'text-[#C68B59]' : 'text-[#2C2A29]'}>
                  {timeLeft} ثانية
                </span>
              </div>
            </div>

            {/* Live Counter Card */}
            <div className="w-full bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl p-6 mb-5 text-center">
              <h3 className="text-2xl font-black text-[#2C2A29] mb-1.5">
                اكتبوا عتادكم في الجوال الآن!
              </h3>
              <p className="text-xs font-bold text-[#5C4033] mb-4">
                سلاحك الهجومي + أداة دفاعك + قوتك الخارقة.. الـ AI سيحسب تصادم العناصر فيزيائياً وكوميدياً!
              </p>

              <div className="inline-block bg-white border-2 border-[#2C2A29] px-6 py-2 rounded-xl text-lg font-black text-[#8A9A5B] mb-5">
                {loadouts.length} من أصل {players.length} مصارعين اعتمدوا عتادهم
              </div>

              {/* Player Status Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {players.map((p) => {
                  const hasSubmitted = loadouts.some((l) => l.playerId === p.id);
                  return (
                    <div
                      key={p.id}
                      className={`p-3 rounded-xl border-2 border-[#2C2A29] font-black text-sm transition-all ${
                        hasSubmitted
                          ? 'bg-[#8A9A5B] text-white shadow-[2px_2px_0px_#2C2A29]'
                          : 'bg-white text-[#2C2A29] opacity-70'
                      }`}
                    >
                      <span>{p.name}</span>
                      <span className="block text-[11px] font-bold mt-0.5">
                        {hasSubmitted ? 'تم اعتماد العتاد ✓' : 'يجهّز العتاد...'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={buildBracketAndStartMatchmaking}
              className="py-3 px-8 bg-[#8A9A5B] text-white border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl font-black text-base hover:bg-[#2C2A29] active:translate-y-0.5 cursor-pointer"
            >
              إغلاق باب التسليح وبدء النزالات
            </button>
          </div>
        )}

        {/* 3. MATCHMAKING TREE / BRACKET OVERVIEW */}
        {phase === 'MATCHMAKING_TREE' && (
          <div className="w-full max-w-4xl flex flex-col items-center">
            <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl p-5 mb-5 text-center w-full">
              <h2 className="text-2xl font-black text-[#2C2A29] mb-1">
                جدول نزالات الحلبة المباشرة (1 ضد 1)
              </h2>
              <p className="text-xs font-bold text-[#5C4033]">
                تم توزيع المواجهات بالقرعة.. جهزوا أنفسكم للصدام الحاسم!
              </p>
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-h-[55vh] overflow-y-auto p-1">
              {duelQueue.map((pair, idx) => (
                <div
                  key={idx}
                  className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-2xl p-4 flex items-center justify-between"
                >
                  <div className="flex-1 text-center bg-white border border-[#2C2A29]/20 p-2.5 rounded-xl">
                    <span className="text-sm font-black text-[#2C2A29] block">{pair[0].playerName}</span>
                    <span className="text-[10px] font-bold text-[#5C4033]">{pair[0].weapon}</span>
                  </div>

                  <div className="px-3 flex flex-col items-center">
                    <span className="text-xs font-black bg-[#2C2A29] text-white px-2 py-0.5 rounded">ضد</span>
                    <span className="text-[10px] font-bold text-[#5C4033] mt-0.5">نزال #{idx + 1}</span>
                  </div>

                  <div className="flex-1 text-center bg-white border border-[#2C2A29]/20 p-2.5 rounded-xl">
                    <span className="text-sm font-black text-[#2C2A29] block">{pair[1].playerName}</span>
                    <span className="text-[10px] font-bold text-[#5C4033]">{pair[1].weapon}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={launchCurrentDuel}
              className="py-3 px-10 bg-[#8A9A5B] text-white border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-xl font-black text-lg hover:bg-[#2C2A29] active:translate-y-0.5 cursor-pointer"
            >
              انطلاق النزال الأول
            </button>
          </div>
        )}

        {/* 4 & 5. DUEL CLASH & RESULT PHASES (No Health Bar - Pure Interaction Simulator) */}
        {(phase === 'DUEL_CLASH' || phase === 'DUEL_RESULT') && currentDuel && (
          <div className="flex-1 flex flex-col justify-between p-4 max-w-5xl mx-auto w-full h-full" dir="rtl">
            {/* Header info */}
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-black bg-[#C68B59] text-white px-3 py-1 rounded-xl border border-[#2C2A29]">
                النزال {currentDuelIndex + 1} من {duelQueue.length}
              </span>
              <h2 className="text-base font-black text-[#2C2A29]">حلبة النزال المباشر 1 ضد 1</h2>
            </div>

            {/* The 1v1 Confrontation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
              {/* Fighter A Card */}
              <div className={`col-span-2 p-5 rounded-2xl border-2 transition-all ${
                currentResult && currentResult.winnerPlayerId === currentDuel[0].playerId
                  ? 'bg-[#F7F4EC] border-[#8A9A5B] shadow-[6px_6px_0px_#8A9A5B]'
                  : 'bg-[#F7F4EC] border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29]'
              }`}>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xl font-black text-[#2C2A29]">{currentDuel[0].playerName}</h3>
                  {currentResult?.winnerPlayerId === currentDuel[0].playerId && (
                    <span className="bg-[#8A9A5B] text-white text-xs font-black px-2.5 py-1 rounded-lg">فائز (+5 pt)</span>
                  )}
                </div>
                <div className="space-y-2 text-sm font-bold">
                  <div className="bg-white p-2 rounded-xl border border-[#2C2A29]/15">
                    <span className="text-[10px] text-[#5C4033] block">السلاح:</span>
                    <span className="text-[#2C2A29]">{currentDuel[0].weapon}</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-[#2C2A29]/15">
                    <span className="text-[10px] text-[#5C4033] block">أداة الدفاع:</span>
                    <span className="text-[#2C2A29]">{currentDuel[0].defense}</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-[#2C2A29]/15">
                    <span className="text-[10px] text-[#5C4033] block">القوة الخارقة:</span>
                    <span className="text-[#2C2A29]">{currentDuel[0].superpower}</span>
                  </div>
                </div>
              </div>

              {/* VS Centerpiece */}
              <div className="col-span-1 flex flex-col items-center justify-center">
                <div className="w-14 h-14 bg-[#2C2A29] text-white rounded-2xl border-2 border-[#2C2A29] shadow-[3px_3px_0px_#8A9A5B] flex items-center justify-center font-black text-xl">
                  ضد
                </div>
                <span className="text-xs font-bold text-[#5C4033] mt-2">نزال مباشر</span>
              </div>

              {/* Fighter B Card */}
              <div className={`col-span-2 p-5 rounded-2xl border-2 transition-all ${
                currentResult && currentResult.winnerPlayerId === currentDuel[1].playerId
                  ? 'bg-[#F7F4EC] border-[#8A9A5B] shadow-[6px_6px_0px_#8A9A5B]'
                  : 'bg-[#F7F4EC] border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29]'
              }`}>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xl font-black text-[#2C2A29]">{currentDuel[1].playerName}</h3>
                  {currentResult?.winnerPlayerId === currentDuel[1].playerId && (
                    <span className="bg-[#8A9A5B] text-white text-xs font-black px-2.5 py-1 rounded-lg">فائز (+5 pt)</span>
                  )}
                </div>
                <div className="space-y-2 text-sm font-bold">
                  <div className="bg-white p-2 rounded-xl border border-[#2C2A29]/15">
                    <span className="text-[10px] text-[#5C4033] block">السلاح:</span>
                    <span className="text-[#2C2A29]">{currentDuel[1].weapon}</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-[#2C2A29]/15">
                    <span className="text-[10px] text-[#5C4033] block">أداة الدفاع:</span>
                    <span className="text-[#2C2A29]">{currentDuel[1].defense}</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-[#2C2A29]/15">
                    <span className="text-[10px] text-[#5C4033] block">القوة الخارقة:</span>
                    <span className="text-[#2C2A29]">{currentDuel[1].superpower}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Clash Narrative / Deliberation Box (No Health Bar) */}
            <div className="mt-5 bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl p-5">
              {isDeliberating ? (
                <div className="text-center py-5">
                  <span className="text-sm font-bold text-[#5C4033] block mb-2">جاري محاكاة صدمة الأسلحة والدفاعات...</span>
                  <h4 className="text-xl font-black text-[#2C2A29]">الـ AI يحلل تصادم العتاد ويحسب الضربة الحاسمة</h4>
                </div>
              ) : currentResult ? (
                <div>
                  <div className="flex items-center justify-between border-b-2 border-[#2C2A29]/15 pb-2 mb-3">
                    <span className="text-xs font-black bg-[#8A9A5B] text-white px-3 py-1 rounded-xl">
                      الفائز بالنزال: {currentResult.winnerName}
                    </span>
                    <span className="text-xs font-bold text-[#5C4033]">
                      حسم المواجهة: {currentResult.decidingFactor}
                    </span>
                  </div>
                  <p className="text-base font-bold text-[#2C2A29] leading-relaxed whitespace-pre-wrap">
                    {currentResult.clashStory}
                  </p>
                </div>
              ) : null}
            </div>

            {/* Next Clash Trigger Button */}
            {!isDeliberating && currentResult && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleNextDuel}
                  className="px-8 py-3 bg-[#8A9A5B] text-white border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-xl font-black text-sm active:translate-y-0.5 hover:bg-[#2C2A29] cursor-pointer"
                >
                  {currentDuelIndex + 1 < duelQueue.length ? 'النزال التالي' : 'عرض منصة التتويج'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 6. TOURNAMENT PODIUM PHASE */}
        {phase === 'TOURNAMENT_PODIUM' && (
          <div className="w-full max-w-3xl bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[6px_6px_0px_#2C2A29] rounded-2xl p-7 text-center">
            <div className="inline-flex p-3 bg-[#E5E0D5] border-2 border-[#2C2A29] rounded-2xl mb-3">
              <Crown className="text-[#8A9A5B]" size={40} />
            </div>

            <h2 className="text-3xl font-black text-[#2C2A29] mb-1">
              منصة تتويج بطولة حرب المصارعة
            </h2>
            <p className="text-xs font-bold text-[#5C4033] mb-5">
              حصيلة نزالات الحلبة والاصطدام الفيزيائي والكوميدي
            </p>

            {/* Champions Cards: Winner & Lowest Fighter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 text-right">
              {grandChampion && (
                <div className="bg-[#8A9A5B]/15 border-2 border-[#8A9A5B] shadow-[4px_4px_0px_#8A9A5B] rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Trophy className="text-[#8A9A5B]" size={22} />
                    <span className="text-sm font-black text-[#8A9A5B]">
                      🥇 بطل الحلبة بلا منازع
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-[#2C2A29] mb-1">
                    {grandChampion.playerName}
                  </h3>
                  <div className="flex items-center gap-3 text-xs font-bold text-[#5C4033]">
                    <span>المجموع: {grandChampion.totalScore} pt</span>
                    <span>نزالات رابحة: {grandChampion.wins}</span>
                  </div>
                </div>
              )}

              {lowestFighter && (
                <div className="bg-[#B85C5C]/15 border-2 border-[#B85C5C] shadow-[4px_4px_0px_#B85C5C] rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Frown className="text-[#B85C5C]" size={22} />
                    <span className="text-sm font-black text-[#B85C5C]">
                      🤡 أكثر مصارع انجلد في الحلبة
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-[#2C2A29] mb-1">
                    {lowestFighter.playerName}
                  </h3>
                  <div className="flex items-center gap-3 text-xs font-bold text-[#5C4033]">
                    <span>المجموع: {lowestFighter.totalScore} pt</span>
                    <span>يحتاج إعادة نظر في عتاده!</span>
                  </div>
                </div>
              )}
            </div>

            {/* Standings List */}
            <div className="space-y-2 mb-5 text-right max-h-[30vh] overflow-y-auto p-1">
              {sortedLeaderboard.map((ps, idx) => (
                <div
                  key={ps.playerId}
                  className="bg-white border-2 border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29] rounded-xl p-3 flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#E5E0D5] border border-[#2C2A29] flex items-center justify-center font-black text-xs">
                      #{idx + 1}
                    </span>
                    <span className="font-black text-base text-[#2C2A29]">{ps.playerName}</span>
                    <span className="text-[11px] font-bold text-[#8A9A5B] bg-[#E5E0D5]/50 px-2 py-0.5 rounded">
                      {ps.wins} فوز
                    </span>
                  </div>
                  <span className="text-lg font-black text-[#2C2A29]">{ps.totalScore} pt</span>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => startLoadoutInputPhase(true)}
                className="py-3 px-8 bg-[#8A9A5B] text-white border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl font-black text-base hover:bg-[#2C2A29] active:translate-y-0.5 cursor-pointer"
              >
                بدء بطولة جديدة
              </button>
              <button
                onClick={handleReturnToLobby}
                className="py-3 px-6 bg-[#C68B59] text-white border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl font-black text-base hover:bg-[#2C2A29] active:translate-y-0.5 cursor-pointer"
              >
                العودة للوبي
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
