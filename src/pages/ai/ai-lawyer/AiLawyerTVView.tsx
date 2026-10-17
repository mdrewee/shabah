// src/pages/ai/ai-lawyer/AiLawyerTVView.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  Gavel,
  Scale,
  Users,
  Clock,
  Trophy,
  Check,
  X,
  Play,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Crown,
  Frown,
  Swords
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useRoom, roomBus } from '../../../lib/roomBus';
import { sound } from '../../../lib/audio';
import { CourtTopBar } from './components/CourtTopBar';
import { UnifiedShabahLobby } from '../../../components/lobby/UnifiedShabahLobby';
import { VerdictStampCard } from './components/VerdictStampCard';
import {
  CourtPhase,
  CourtCase,
  PlayerDefense,
  CourtVerdict,
  PlayerScore,
  COURT_CASES_BANK,
  getNextCase
} from './types';
import { calculateCourtScores } from './services/courtScoring';

const CASE_BRIEF_DURATION = 15;
const DEFENSE_INPUT_DURATION = 45;

interface AiLawyerTVViewProps {
  roomCode?: string;
}

export const AiLawyerTVView: React.FC<AiLawyerTVViewProps> = ({ roomCode: propRoomCode }) => {
  const params = useParams();
  const navigate = useNavigate();
  const roomCode = (propRoomCode || params.code || params.roomId || params.id || '').trim().toUpperCase() || 'TAQ1';

  const { room } = useRoom(roomCode);
  const activeRoom = room || roomBus.getRoom(roomCode);

  // Realtime Channel References (Strict Singleton Guard)
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef<boolean>(false);

  // Core Game States
  const [phase, setPhase] = useState<CourtPhase>('LOBBY');
  const phaseRef = useRef<CourtPhase>('LOBBY');
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // Round tracking (1, 2, 3...)
  const [currentRound, setCurrentRound] = useState(1);
  const currentRoundRef = useRef(1);
  useEffect(() => { currentRoundRef.current = currentRound; }, [currentRound]);

  // Infinite Tie-Breaker flag
  const [isTieBreaker, setIsTieBreaker] = useState(false);
  const isTieBreakerRef = useRef(false);
  useEffect(() => { isTieBreakerRef.current = isTieBreaker; }, [isTieBreaker]);

  // Played cases tracking to prevent repetition
  const [playedCaseIds, setPlayedCaseIds] = useState<string[]>([]);
  const playedCaseIdsRef = useRef<string[]>([]);
  useEffect(() => { playedCaseIdsRef.current = playedCaseIds; }, [playedCaseIds]);

  const [currentCase, setCurrentCase] = useState<CourtCase>(() => getNextCase([]));
  const caseRef = useRef<CourtCase>(currentCase);
  useEffect(() => { caseRef.current = currentCase; }, [currentCase]);

  const [timeLeft, setTimeLeft] = useState(0);
  const timeLeftRef = useRef(0);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  const [defenses, setDefenses] = useState<PlayerDefense[]>([]);
  const defensesRef = useRef<PlayerDefense[]>([]);
  useEffect(() => { defensesRef.current = defenses; }, [defenses]);

  const [verdict, setVerdict] = useState<CourtVerdict | null>(null);
  const verdictRef = useRef<CourtVerdict | null>(null);
  useEffect(() => { verdictRef.current = verdict; }, [verdict]);

  const [scores, setScores] = useState<Record<string, PlayerScore>>({});
  const scoresRef = useRef<Record<string, PlayerScore>>({});
  useEffect(() => { scoresRef.current = scores; }, [scores]);

  const [isEvaluating, setIsEvaluating] = useState(false);

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

  // Safe Broadcast Helper using the ref
  const broadcastEvent = async (event: string, payload: any) => {
    if (!channelRef.current || !isSubscribedRef.current) {
      console.warn(`[TV Courtroom] Cannot broadcast ${event}: Channel not subscribed yet.`);
      return;
    }
    try {
      await channelRef.current.send({
        type: 'broadcast',
        event,
        payload
      });
    } catch (err) {
      console.warn(`[TV Courtroom] Broadcast error for ${event}:`, err);
    }
  };

  // Helper for incoming defenses
  const handleIncomingDefense = (payload: any) => {
    if (!payload || !payload.playerId) return;
    sound.playClick();
    setDefenses((prev) => {
      const filtered = prev.filter((d) => d.playerId !== payload.playerId);
      const updated = [
        ...filtered,
        {
          playerId: payload.playerId,
          playerName: payload.playerName || 'متهم',
          argumentText: payload.argumentText || ''
        }
      ];
      defensesRef.current = updated;
      return updated;
    });
  };

  // Definitive Stable Channel Lifecycle (Strictly [roomCode] dependency)
  useEffect(() => {
    const normalizedCode = roomCode.trim().toUpperCase();
    const channelName = `courtroom:${normalizedCode}`;

    if (channelRef.current) {
      console.log(`[TV Courtroom] Removing existing channel before initialization: ${channelName}`);
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log(`[TV Courtroom] Initializing channel: ${channelName}`);
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
          courtCase: caseRef.current,
          currentRound: currentRoundRef.current,
          totalRounds: isTieBreakerRef.current ? currentRoundRef.current : 3,
          isTieBreaker: isTieBreakerRef.current,
          timeLeft: timeLeftRef.current,
          defenses: defensesRef.current,
          verdict: verdictRef.current,
          scores: scoresRef.current,
          readyPlayerIds: Array.from(readyPlayerIdsRef.current)
        };
        channelRef.current.send({
          type: 'broadcast',
          event: 'ROOM_STATE_SYNC',
          payload: syncPayload
        }).catch(() => {});
        channelRef.current.send({
          type: 'broadcast',
          event: 'COURT_ROOM_STATE_SYNC',
          payload: syncPayload
        }).catch(() => {});
      })
      .on('broadcast', { event: 'SUBMIT_DEFENSE' }, ({ payload }) => {
        handleIncomingDefense(payload);
      })
      .on('broadcast', { event: 'COURT_SUBMIT_DEFENSE' }, ({ payload }) => {
        handleIncomingDefense(payload);
      });

    // Subscribe ONCE with safe status logging
    channel.subscribe((status) => {
      console.log(`[TV Courtroom Channel]: ${status}`);
      if (status === 'SUBSCRIBED') {
        isSubscribedRef.current = true;
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        isSubscribedRef.current = false;
      }
    });

    return () => {
      console.log(`[TV Courtroom] Cleaning up channel: ${channelName}`);
      isSubscribedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomCode]); // ONLY roomCode in dependency array!

  // 1. Reactive Auto-Start 3-second Countdown (whenever readyPlayerIds.size >= 2)
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
      startCaseBriefPhase(true, false);
      setCountdown(null);
      return;
    }

    const timer = setTimeout(() => {
      sound.playTick();
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, phase]);

  // Global Countdown Timer for CASE_BRIEF and DEFENSE_INPUT
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

  // Auto-advance logic (Immediate transition to verdict without intermediate screen)
  useEffect(() => {
    if (phase === 'CASE_BRIEF' && timeLeft === 0) {
      startDefenseInputPhase();
    }

    if (phase === 'DEFENSE_INPUT') {
      const activePlayers = playersRef.current;
      const allSubmitted = activePlayers.length > 0 && defenses.length >= activePlayers.length;
      if (allSubmitted || timeLeft === 0) {
        startDeliberationPhase();
      }
    }
  }, [phase, timeLeft, defenses.length]);

  // Phase transitions
  const startCaseBriefPhase = (isNewMatch = false, isTie = false) => {
    sound.playClick();
    if (isNewMatch) {
      setCurrentRound(1);
      currentRoundRef.current = 1;
      setIsTieBreaker(false);
      isTieBreakerRef.current = false;
      setScores({});
      scoresRef.current = {};
      setPlayedCaseIds([]);
      playedCaseIdsRef.current = [];
    }

    const nextCase = getNextCase(playedCaseIdsRef.current);
    setCurrentCase(nextCase);
    caseRef.current = nextCase;

    const nextPlayed = [...playedCaseIdsRef.current, nextCase.id];
    setPlayedCaseIds(nextPlayed);
    playedCaseIdsRef.current = nextPlayed;

    setDefenses([]);
    defensesRef.current = [];
    setVerdict(null);
    verdictRef.current = null;
    setCountdown(null);

    setPhase('CASE_BRIEF');
    phaseRef.current = 'CASE_BRIEF';
    setTimeLeft(CASE_BRIEF_DURATION);

    broadcastEvent('COURT_PHASE_CHANGE', {
      phase: 'CASE_BRIEF',
      courtCase: nextCase,
      currentRound: currentRoundRef.current,
      totalRounds: isTie ? currentRoundRef.current : 3,
      isTieBreaker: isTie,
      duration: CASE_BRIEF_DURATION
    });
  };

  const startDefenseInputPhase = () => {
    sound.playClick();
    setPhase('DEFENSE_INPUT');
    phaseRef.current = 'DEFENSE_INPUT';
    setTimeLeft(DEFENSE_INPUT_DURATION);

    broadcastEvent('COURT_PHASE_CHANGE', {
      phase: 'DEFENSE_INPUT',
      courtCase: caseRef.current,
      currentRound: currentRoundRef.current,
      totalRounds: isTieBreakerRef.current ? currentRoundRef.current : 3,
      isTieBreaker: isTieBreakerRef.current,
      duration: DEFENSE_INPUT_DURATION
    });
  };

  const startDeliberationPhase = async () => {
    if (isEvaluating) return;
    setIsEvaluating(true);

    sound.playClick();

    // Preserve and auto-fill missing defenses
    const currentDefs = [...defensesRef.current];
    playersRef.current.forEach((p) => {
      if (!currentDefs.some((d) => d.playerId === p.id)) {
        currentDefs.push({
          playerId: p.id,
          playerName: p.name,
          argumentText: 'سكت وما كتب أي عذر.. مقر بالتهمة تماماً!'
        });
      }
    });
    setDefenses(currentDefs);
    defensesRef.current = currentDefs;

    setPhase('JUDGE_DELIBERATION');
    phaseRef.current = 'JUDGE_DELIBERATION';
    setTimeLeft(0);

    broadcastEvent('COURT_PHASE_CHANGE', {
      phase: 'JUDGE_DELIBERATION',
      courtCase: caseRef.current,
      currentRound: currentRoundRef.current,
      totalRounds: isTieBreakerRef.current ? currentRoundRef.current : 3,
      isTieBreaker: isTieBreakerRef.current
    });

    try {
      const response = await supabase.functions.invoke('ai-judge', {
        body: {
          courtCase: caseRef.current,
          playerDefenses: currentDefs
        }
      });

      if (response.error || !response.data) {
        throw response.error || new Error('No verdict data returned');
      }

      const verdictData = response.data as CourtVerdict;

      // 2. Excuses Sync Pipeline Fix: Map back original argumentText
      const evaluationsWithArguments = (verdictData?.evaluations || []).map((ev: any) => {
        const originalDefense = currentDefs.find((d) => d.playerId === ev.playerId);
        return {
          ...ev,
          argumentText: originalDefense?.argumentText || ev.argumentText || 'لم يقدّم عذراً (انسحب)'
        };
      });

      const fullVerdict: CourtVerdict = {
        ...verdictData,
        evaluations: evaluationsWithArguments
      };

      handleVerdictDelivered(fullVerdict);
    } catch (err) {
      console.warn('[AI Judge Invocation Failed, using fallback]:', err);
      const fallbackDefs = defensesRef.current;
      const winnerId = fallbackDefs[0]?.playerId || 'p1';
      const fallbackVerdict: CourtVerdict = {
        winnerPlayerId: winnerId,
        winnerReason: 'أقل المتهمين كذباً وسلكت معه المحكمة بحسن نية!',
        judgeSummary: 'جلسة مليانة ترقيع مفضوح.. لكن المحكمة تكتفي بتسجيل صك التوبيخ!',
        evaluations: fallbackDefs.map((d, i) => ({
          playerId: d.playerId,
          playerName: d.playerName,
          argumentText: d.argumentText || 'لم يقدّم عذراً (انسحب)',
          verdict: i === 0 ? 'مقبول' : 'مرفوض',
          logicScore: i === 0 ? 8 : 3,
          roastReason: i === 0
            ? 'ترقيعة مقبولة قياساً بباقي الأعذار التافهة.'
            : `عذر "${(d.argumentText || '').slice(0, 30)}..." مفضوح وما يترقع أبداً!`
        }))
      };
      handleVerdictDelivered(fallbackVerdict);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleVerdictDelivered = (courtVerdict: CourtVerdict) => {
    sound.playVictory();
    setVerdict(courtVerdict);
    verdictRef.current = courtVerdict;

    const updatedScores = calculateCourtScores(
      scoresRef.current,
      courtVerdict.evaluations,
      courtVerdict.winnerPlayerId
    );
    setScores(updatedScores);
    scoresRef.current = updatedScores;

    setPhase('VERDICT_REVEAL');
    phaseRef.current = 'VERDICT_REVEAL';

    // Broadcast payload to all mobiles
    const verdictPayload = {
      phase: 'VERDICT_REVEAL',
      verdict: courtVerdict,
      scores: updatedScores,
      currentRound: currentRoundRef.current,
      totalRounds: isTieBreakerRef.current ? currentRoundRef.current : 3,
      isTieBreaker: isTieBreakerRef.current
    };

    broadcastEvent('COURT_VERDICT_ANNOUNCED', verdictPayload);
    broadcastEvent('VERDICT_REVEAL', verdictPayload);
  };

  // 5. Infinite Tie-Breaker Protocol
  const handleNextRoundOrPodium = () => {
    sound.playClick();

    if (currentRound < 3) {
      // Regular rounds (1 -> 2 -> 3)
      const nextR = currentRound + 1;
      setCurrentRound(nextR);
      currentRoundRef.current = nextR;
      startCaseBriefPhase(false, false);
      return;
    }

    // Round 3 or later: Check for ties for 1st place!
    const sortedScores = Object.values(scoresRef.current).sort((a, b) => b.totalScore - a.totalScore);
    const highestScore = sortedScores[0]?.totalScore ?? 0;
    const topTiedPlayers = sortedScores.filter((p) => p.totalScore === highestScore);

    if (topTiedPlayers.length > 1) {
      console.log('[TV] Tie detected for 1st place! Triggering Tie-Breaker Case...');
      setIsTieBreaker(true);
      isTieBreakerRef.current = true;
      const nextR = currentRound + 1;
      setCurrentRound(nextR);
      currentRoundRef.current = nextR;
      startCaseBriefPhase(false, true); // Launch tie-breaker case!
      return;
    }

    // Clear single champion exists -> Finish Match!
    setIsTieBreaker(false);
    isTieBreakerRef.current = false;
    setPhase('MATCH_PODIUM');
    phaseRef.current = 'MATCH_PODIUM';

    broadcastEvent('MATCH_PODIUM', { scores: scoresRef.current });
    broadcastEvent('COURT_PHASE_CHANGE', {
      phase: 'MATCH_PODIUM',
      scores: scoresRef.current,
      totalRounds: currentRoundRef.current
    });
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
    setDefenses([]);
    defensesRef.current = [];
    setVerdict(null);
    verdictRef.current = null;
    setReadyPlayerIds(new Set());
    setCountdown(null);
    setIsTieBreaker(false);
    broadcastEvent('RETURN_TO_LOBBY', {});
  };

  const handleLeaveRoom = () => {
    navigate('/');
  };

  const sortedLeaderboard = Object.values(scores).sort((a, b) => b.totalScore - a.totalScore);
  const podiumWinner = sortedLeaderboard[0];
  const podiumLoser = sortedLeaderboard.length > 1 ? sortedLeaderboard[sortedLeaderboard.length - 1] : null;

  if (phase === 'LOBBY') {
    return (
      <UnifiedShabahLobby
        roomCode={roomCode}
        gameId="ai-lawyer"
        gameTitle="شبح القاضي"
        players={players.map((p) => ({
          id: p.id,
          name: p.name,
          isReady: readyPlayerIds.has(p.id),
        }))}
        role="host"
        onStartGame={() => startCaseBriefPhase(true, false)}
        onKickPlayer={handleKickPlayer}
        onExit={handleLeaveRoom}
        minPlayers={1}
      />
    );
  }

  return (
    <div className="w-full h-screen bg-[#000000] flex flex-col justify-between overflow-hidden font-sans select-none" dir="rtl">
      {/* TopBar with strict ochre buttons */}
      <CourtTopBar
        roomCode={roomCode}
        phase={phase}
        onReturnToLobby={handleReturnToLobby}
        onLeaveRoom={handleLeaveRoom}
        isHost={true}
      />

      {/* Main Screen Content */}
      <main className="flex-1 p-6 flex flex-col justify-center items-center overflow-hidden">
        {/* 1. LOBBY PHASE */}
        {false && (
          <div className="w-full max-w-4xl flex flex-col items-center">
            {/* Header Title */}
            <div className="flex items-center gap-3 bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] px-6 py-2.5 rounded-2xl mb-4">
              <Scale className="text-[#8A9A5B]" size={32} />
              <div>
                <h1 className="text-2xl font-black text-[#2C2A29]">المحامي الـ AI</h1>
                <p className="text-xs font-bold text-[#5C4033]">
                  محكمة الاستراحة الساخرة.. بطولة من 3 جولات وقضية فاصلة عند التعادل
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
              <div className="mt-2 mb-3 bg-[#8A9A5B] text-white px-6 py-3 rounded-2xl border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] text-center animate-pulse">
                <span className="text-xl font-black">
                  اكتمل النصاب! تبدأ المحاكمة خلال {countdown}...
                </span>
              </div>
            )}

            {/* Players List with Kick & Ready status */}
            <div className="w-full bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl p-4 mb-4">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-sm font-black text-[#2C2A29]">
                  المتهمين في القاعة ({players.length}) — الجاهزون ({readyPlayerIds.size})
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
                        title="طرد المتهم"
                        className="text-[#C68B59] hover:text-[#2C2A29] p-0.5 rounded cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
                {players.length === 0 && (
                  <p className="text-xs font-bold text-[#5C4033]/70">بانتظار انضمام المتهمين عبر الجوال...</p>
                )}
              </div>
            </div>

            {/* Manual Start Button */}
            <button
              onClick={() => startCaseBriefPhase(true, false)}
              disabled={players.length < 2}
              className={`px-8 py-3.5 rounded-xl border-2 border-[#2C2A29] font-black text-lg shadow-[4px_4px_0px_#2C2A29] transition-all active:translate-y-0.5 ${
                players.length >= 2
                  ? 'bg-[#8A9A5B] text-white hover:bg-[#2C2A29] cursor-pointer'
                  : 'bg-[#E5E0D5] text-[#2C2A29]/40 border-[#2C2A29]/30 shadow-none cursor-not-allowed'
              }`}
            >
              بدء جلسة المحاكمة فوراً
            </button>
          </div>
        )}

        {/* 2. CASE BRIEF PHASE (15s) */}
        {phase === 'CASE_BRIEF' && (
          <div className="w-full max-w-3xl flex flex-col items-center">
            <div className="flex justify-between items-center w-full mb-4">
              <span className={`text-sm font-black px-3 py-1 rounded-xl border border-[#2C2A29] ${
                isTieBreaker ? 'bg-[#B85C5C] text-white animate-pulse' : 'bg-[#C68B59] text-white'
              }`}>
                {isTieBreaker ? '⚖️ القضية الفاصلة لكسر التعادل' : `الجولة ${currentRound} من 3`}
              </span>
              <div className="flex items-center gap-1.5 text-sm font-black bg-[#F7F4EC] border-2 border-[#2C2A29] px-3 py-1 rounded-xl">
                <Clock size={16} />
                <span>{timeLeft} ثانية</span>
              </div>
            </div>

            <div className="w-full bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[6px_6px_0px_#2C2A29] rounded-2xl p-7 mb-5 text-center">
              <div className="inline-flex p-3 bg-[#E5E0D5] border-2 border-[#2C2A29] rounded-2xl mb-3">
                {isTieBreaker ? <Swords className="text-[#B85C5C]" size={36} /> : <Gavel className="text-[#8A9A5B]" size={36} />}
              </div>

              <h2 className="text-2xl font-black text-[#2C2A29] mb-3">
                {currentCase.title}
              </h2>

              <div className="bg-white border-2 border-[#2C2A29] rounded-xl p-3.5 mb-3 text-right">
                <span className="text-xs font-black text-[#C68B59] block mb-1">
                  التهمة الرسمية الموجهة للجميع:
                </span>
                <p className="text-base font-black text-[#2C2A29] leading-relaxed">
                  {currentCase.charge}
                </p>
              </div>

              <div className="bg-[#E5E0D5]/50 border-2 border-[#2C2A29]/20 rounded-xl p-3.5 text-right">
                <span className="text-xs font-bold text-[#5C4033] block mb-1">
                  تفاصيل الموقف:
                </span>
                <p className="text-xs font-bold text-[#5C4033] leading-relaxed">
                  {currentCase.context}
                </p>
              </div>
            </div>

            <button
              onClick={startDefenseInputPhase}
              className="py-3 px-8 bg-[#8A9A5B] text-white border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl font-black text-base hover:bg-[#2C2A29] active:translate-y-0.5 cursor-pointer"
            >
              تخطي إلى كتابة الأعذار
            </button>
          </div>
        )}

        {/* 3. DEFENSE INPUT PHASE (45s) */}
        {phase === 'DEFENSE_INPUT' && (
          <div className="w-full max-w-4xl flex flex-col items-center">
            <div className="flex justify-between items-center w-full mb-4">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-black px-3 py-1 rounded-xl border border-[#2C2A29] ${
                  isTieBreaker ? 'bg-[#B85C5C] text-white animate-pulse' : 'bg-[#C68B59] text-white'
                }`}>
                  {isTieBreaker ? '⚖️ قضية فاصلة' : `الجولة ${currentRound} من 3`}
                </span>
                <span className="text-sm font-black text-[#2C2A29] bg-[#F7F4EC] px-3 py-1 rounded-xl border border-[#2C2A29]">
                  القضية: {currentCase.title}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-base font-black bg-[#F7F4EC] border-2 border-[#2C2A29] px-4 py-1.5 rounded-xl">
                <Clock size={18} />
                <span className={timeLeft <= 10 ? 'text-[#C68B59]' : 'text-[#2C2A29]'}>
                  {timeLeft} ثانية
                </span>
              </div>
            </div>

            {/* Live Counter Card */}
            <div className="w-full bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl p-6 mb-5 text-center">
              <h3 className="text-xl font-black text-[#2C2A29] mb-1.5">
                اكتبوا أعذاركم ومرافعاتكم على الجوال الآن!
              </h3>
              <p className="text-xs font-bold text-[#5C4033] mb-4">
                القاضي يكشف الدراما والتسليك.. رقع لنفسك بذكاء وتفادى الجلد!
              </p>

              <div className="inline-block bg-white border-2 border-[#2C2A29] px-6 py-2 rounded-xl text-lg font-black text-[#8A9A5B] mb-5">
                {defenses.length} من أصل {players.length} متهمين سلّموا أعذارهم
              </div>

              {/* Player Status Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {players.map((p) => {
                  const hasSubmitted = defenses.some((d) => d.playerId === p.id);
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
                        {hasSubmitted ? 'تم التسليم ✓' : 'يكتب العذر...'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={startDeliberationPhase}
              className="py-3 px-8 bg-[#8A9A5B] text-white border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl font-black text-base hover:bg-[#2C2A29] active:translate-y-0.5 cursor-pointer"
            >
              إنهاء الوقت والحكم فوراً
            </button>
          </div>
        )}

        {/* 4. JUDGE DELIBERATION PHASE */}
        {phase === 'JUDGE_DELIBERATION' && (
          <div className="w-full max-w-xl bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[6px_6px_0px_#2C2A29] rounded-2xl p-10 text-center">
            <div className="inline-flex p-4 bg-[#E5E0D5] border-2 border-[#2C2A29] rounded-2xl mb-4">
              <Gavel className="text-[#8A9A5B]" size={48} />
            </div>

            <h2 className="text-2xl font-black text-[#2C2A29] mb-2">
              محكمة الاستراحة منعقدة للمداولة
            </h2>
            <p className="text-sm font-bold text-[#5C4033] leading-relaxed">
              القاضي يفحص الأعذار، يكشف محاولات الدراما والتسليك بالعبادات، ويصيغ صك الحكم والجلد...
            </p>

            <div className="mt-6 flex justify-center items-center gap-2 text-xs font-black text-[#8A9A5B]">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#8A9A5B]" />
              <span>جاري توثيق صك الأحكام والأختام...</span>
            </div>
          </div>
        )}

        {/* 5. VERDICT REVEAL PHASE */}
        {phase === 'VERDICT_REVEAL' && verdict && (
          <div className="w-full max-w-5xl flex flex-col items-center">
            {/* Top Summary & Round Indicator */}
            <div className="w-full bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl p-3.5 mb-2.5 text-center flex justify-between items-center px-6">
              <span className={`text-xs font-black px-3 py-1 rounded-lg border border-[#2C2A29] ${
                isTieBreaker ? 'bg-[#B85C5C] text-white animate-pulse' : 'bg-[#C68B59] text-white'
              }`}>
                {isTieBreaker ? '⚖️ نتيجة القضية الفاصلة' : `الجولة ${currentRound} من 3`}
              </span>
              <p className="text-sm font-black text-[#2C2A29] flex-1 px-4 leading-snug">
                "{verdict.judgeSummary}"
              </p>
              <span className="text-xs font-bold text-[#5C4033]">
                صك حكم القاضي
              </span>
            </div>

            {/* Winner Spotlight Banner */}
            {(() => {
              const winnerEval = verdict.evaluations.find((e) => e.playerId === verdict.winnerPlayerId);
              return (
                <div className="w-full bg-[#8A9A5B] text-white border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl p-3 mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy size={26} />
                    <div>
                      <span className="text-xs font-black block">أقوى ترقيعة (+5 pt):</span>
                      <h3 className="text-base font-black">{winnerEval?.playerName || 'متهم'}</h3>
                    </div>
                  </div>
                  <p className="text-xs font-bold max-w-md text-right leading-tight">
                    {verdict.winnerReason}
                  </p>
                </div>
              );
            })()}

            {/* Evaluations Cards Grid using VerdictStampCard (Dynamic height, fully wrapped) */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[55vh] overflow-y-auto mb-3 p-1">
              {verdict.evaluations.map((ev) => (
                <VerdictStampCard
                  key={ev.playerId}
                  evaluation={ev}
                  isWinner={ev.playerId === verdict.winnerPlayerId}
                />
              ))}
            </div>

            <button
              onClick={handleNextRoundOrPodium}
              className="py-3 px-8 bg-[#8A9A5B] text-white border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl font-black text-base hover:bg-[#2C2A29] active:translate-y-0.5 cursor-pointer"
            >
              {currentRound < 3
                ? `الانتقال للجولة القادمة (الجولة ${currentRound + 1} من 3)`
                : 'فحص الترتيب والتتويج (أو كسر التعادل)'}
            </button>
          </div>
        )}

        {/* 6. MATCH PODIUM PHASE (Championship Finale) */}
        {phase === 'MATCH_PODIUM' && (
          <div className="w-full max-w-3xl bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[6px_6px_0px_#2C2A29] rounded-2xl p-7 text-center">
            <div className="inline-flex p-3 bg-[#E5E0D5] border-2 border-[#2C2A29] rounded-2xl mb-3">
              <Crown className="text-[#8A9A5B]" size={40} />
            </div>

            <h2 className="text-3xl font-black text-[#2C2A29] mb-1">
              منصة تتويج محكمة الاستراحة
            </h2>
            <p className="text-xs font-bold text-[#5C4033] mb-5">
              حصيلة {currentRound} جولات كاملة من الترقيع والجلد القضائي
            </p>

            {/* Champions Cards: Winner & Loser Highlight */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 text-right">
              {podiumWinner && (
                <div className="bg-[#8A9A5B]/15 border-2 border-[#8A9A5B] shadow-[4px_4px_0px_#8A9A5B] rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Trophy className="text-[#8A9A5B]" size={22} />
                    <span className="text-sm font-black text-[#8A9A5B]">
                      🥇 محامي الجلسة الأول
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-[#2C2A29] mb-1">
                    {podiumWinner.playerName}
                  </h3>
                  <div className="flex items-center gap-3 text-xs font-bold text-[#5C4033]">
                    <span>المجموع: {podiumWinner.totalScore} pt</span>
                    <span>فوز بالقضايا: {podiumWinner.winsCount}</span>
                  </div>
                </div>
              )}

              {podiumLoser && (
                <div className="bg-[#B85C5C]/15 border-2 border-[#B85C5C] shadow-[4px_4px_0px_#B85C5C] rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Frown className="text-[#B85C5C]" size={22} />
                    <span className="text-sm font-black text-[#B85C5C]">
                      🤡 أفشل مرقع في الجلسة
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-[#2C2A29] mb-1">
                    {podiumLoser.playerName}
                  </h3>
                  <div className="flex items-center gap-3 text-xs font-bold text-[#5C4033]">
                    <span>المجموع: {podiumLoser.totalScore} pt</span>
                    <span>سجل أسوأ ترقيعات مردودة</span>
                  </div>
                </div>
              )}
            </div>

            {/* Cumulative Rankings List */}
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
                    {ps.winsCount > 0 && (
                      <span className="text-[11px] font-bold text-[#8A9A5B] bg-[#E5E0D5]/50 px-2 py-0.5 rounded">
                        {ps.winsCount} فوز
                      </span>
                    )}
                  </div>
                  <span className="text-lg font-black text-[#2C2A29]">{ps.totalScore} pt</span>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => startCaseBriefPhase(true, false)}
                className="py-3 px-8 bg-[#8A9A5B] text-white border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl font-black text-base hover:bg-[#2C2A29] active:translate-y-0.5 cursor-pointer"
              >
                بدء محاكمة جديدة (3 جولات)
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
