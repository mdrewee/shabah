// src/pages/ai/ai-lawyer/AiLawyerMobileView.tsx
import React, { useState, useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Gavel, Scale, Clock, Trophy, Check, Send, AlertCircle, Crown, Frown, Swords } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { CourtTopBar } from './components/CourtTopBar';
import { MobileTopBar } from '../../../components/MobileTopBar';
import { clearPlayerSession } from '../../../utils/playerSession';
import { VerdictStampCard } from './components/VerdictStampCard';
import { UnifiedShabahLobby } from '../../../components/lobby/UnifiedShabahLobby';
import {
  CourtPhase,
  CourtCase,
  CourtVerdict,
  PlayerScore,
  PlayerDefense,
  COURT_CASES_BANK
} from './types';

interface AiLawyerMobileViewProps {
  roomCode: string;
  playerId: string;
  playerName: string;
  channel?: RealtimeChannel;
  onLeaveRoom?: () => void;
}

export const AiLawyerMobileView: React.FC<AiLawyerMobileViewProps> = ({
  roomCode,
  playerId,
  playerName,
  onLeaveRoom
}) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef<boolean>(false);

  const [phase, setPhase] = useState<CourtPhase>('LOBBY');
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(3);
  const [isTieBreaker, setIsTieBreaker] = useState(false);
  const [courtCase, setCourtCase] = useState<CourtCase>(COURT_CASES_BANK[0]);
  const [argumentText, setArgumentText] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [defenses, setDefenses] = useState<PlayerDefense[]>([]);
  const [verdict, setVerdict] = useState<CourtVerdict | null>(null);
  const [scores, setScores] = useState<Record<string, PlayerScore>>({});
  const [isReady, setIsReady] = useState(false);

  // Definitive Stable Channel Lifecycle (Strictly [roomCode] dependency)
  useEffect(() => {
    const normalizedCode = (roomCode || '').trim().toUpperCase();
    if (!normalizedCode) return;
    const channelName = `courtroom:${normalizedCode}`;

    if (channelRef.current) {
      console.log(`[Mobile Courtroom] Removing existing channel before initialization: ${channelName}`);
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log(`[Mobile Courtroom] Initializing channel: ${channelName}`);
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false, ack: false }
      }
    });
    channelRef.current = channel;

    // Listeners setup BEFORE subscribing
    channel
      .on('broadcast', { event: 'KICK_PLAYER' }, ({ payload }) => {
        if (payload?.playerId === playerId) {
          alert('تم طردك من القاعة بواسطة المضيف');
          if (onLeaveRoom) {
            onLeaveRoom();
          } else {
            window.location.href = '/';
          }
        }
      })
      .on('broadcast', { event: 'PLAYER_READY_LIST' }, ({ payload }) => {
        if (!payload) return;
        if (Array.isArray(payload.readyPlayerIds)) {
          setIsReady(payload.readyPlayerIds.includes(playerId));
        }
      })
      .on('broadcast', { event: 'COURT_PHASE_CHANGE' }, ({ payload }) => {
        if (!payload) return;
        if (payload.courtCase) setCourtCase(payload.courtCase);
        if (payload.currentRound) setCurrentRound(payload.currentRound);
        if (payload.totalRounds) setTotalRounds(payload.totalRounds);
        if (typeof payload.isTieBreaker === 'boolean') setIsTieBreaker(payload.isTieBreaker);
        if (payload.phase) {
          setPhase(payload.phase);
          if (payload.phase === 'CASE_BRIEF' || payload.phase === 'LOBBY') {
            setArgumentText('');
            setHasSubmitted(false);
            setVerdict(null);
          }
        }
        if (payload.defenses) setDefenses(payload.defenses);
        if (payload.scores) setScores(payload.scores);
      })
      .on('broadcast', { event: 'COURT_VERDICT_ANNOUNCED' }, ({ payload }) => {
        if (!payload) return;
        if (payload.verdict) setVerdict(payload.verdict);
        if (payload.scores) setScores(payload.scores);
        if (payload.currentRound) setCurrentRound(payload.currentRound);
        if (payload.totalRounds) setTotalRounds(payload.totalRounds);
        if (typeof payload.isTieBreaker === 'boolean') setIsTieBreaker(payload.isTieBreaker);
        setPhase('VERDICT_REVEAL');
      })
      .on('broadcast', { event: 'VERDICT_REVEAL' }, ({ payload }) => {
        if (!payload) return;
        if (payload.verdict) setVerdict(payload.verdict);
        if (payload.scores) setScores(payload.scores);
        if (payload.currentRound) setCurrentRound(payload.currentRound);
        if (payload.totalRounds) setTotalRounds(payload.totalRounds);
        if (typeof payload.isTieBreaker === 'boolean') setIsTieBreaker(payload.isTieBreaker);
        setPhase('VERDICT_REVEAL');
      })
      .on('broadcast', { event: 'MATCH_PODIUM' }, ({ payload }) => {
        if (payload?.scores) setScores(payload.scores);
        setPhase('MATCH_PODIUM');
      })
      .on('broadcast', { event: 'RETURN_TO_LOBBY' }, () => {
        setPhase('LOBBY');
        setArgumentText('');
        setHasSubmitted(false);
        setVerdict(null);
        setDefenses([]);
        setIsReady(false);
        setIsTieBreaker(false);
      })
      .on('broadcast', { event: 'ROOM_STATE_SYNC' }, ({ payload }) => {
        if (!payload) return;
        if (payload.courtCase) setCourtCase(payload.courtCase);
        if (payload.phase) setPhase(payload.phase);
        if (payload.currentRound) setCurrentRound(payload.currentRound);
        if (payload.totalRounds) setTotalRounds(payload.totalRounds);
        if (typeof payload.isTieBreaker === 'boolean') setIsTieBreaker(payload.isTieBreaker);
        if (payload.defenses) setDefenses(payload.defenses);
        if (payload.verdict) setVerdict(payload.verdict);
        if (payload.scores) setScores(payload.scores);
        if (Array.isArray(payload.readyPlayerIds)) {
          setIsReady(payload.readyPlayerIds.includes(playerId));
        }
      })
      .on('broadcast', { event: 'COURT_ROOM_STATE_SYNC' }, ({ payload }) => {
        if (!payload) return;
        if (payload.courtCase) setCourtCase(payload.courtCase);
        if (payload.phase) setPhase(payload.phase);
        if (payload.currentRound) setCurrentRound(payload.currentRound);
        if (payload.totalRounds) setTotalRounds(payload.totalRounds);
        if (typeof payload.isTieBreaker === 'boolean') setIsTieBreaker(payload.isTieBreaker);
        if (payload.defenses) setDefenses(payload.defenses);
        if (payload.verdict) setVerdict(payload.verdict);
        if (payload.scores) setScores(payload.scores);
        if (Array.isArray(payload.readyPlayerIds)) {
          setIsReady(payload.readyPlayerIds.includes(playerId));
        }
      });

    // Subscribe ONCE with safe status logging
    channel.subscribe((status) => {
      console.log(`[Mobile Courtroom Channel]: ${status}`);
      if (status === 'SUBSCRIBED') {
        isSubscribedRef.current = true;
        channel.send({
          type: 'broadcast',
          event: 'PLAYER_JOIN',
          payload: { player: { id: playerId, name: playerName } }
        }).catch(() => {});
        channel.send({
          type: 'broadcast',
          event: 'REQUEST_ROOM_STATE',
          payload: { playerId }
        }).catch(() => {});
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        isSubscribedRef.current = false;
      }
    });

    return () => {
      console.log(`[Mobile Courtroom] Cleaning up channel: ${channelName}`);
      isSubscribedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomCode]); // ONLY roomCode in dependency array!

  const handleToggleReady = () => {
    const nextReady = !isReady;
    setIsReady(nextReady);
    if (channelRef.current && isSubscribedRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'PLAYER_READY_TOGGLE',
        payload: {
          playerId,
          isReady: nextReady
        }
      }).catch((e) => console.warn('[Mobile Ready Error]:', e));
    }
  };

  const handleSubmitDefense = () => {
    const trimmed = argumentText.trim();
    if (!trimmed) return;

    if (channelRef.current && isSubscribedRef.current) {
      const payload = {
        playerId,
        playerName,
        argumentText: trimmed
      };
      channelRef.current.send({
        type: 'broadcast',
        event: 'SUBMIT_DEFENSE',
        payload
      }).catch((e) => console.warn('[Mobile Submit Error]:', e));
      channelRef.current.send({
        type: 'broadcast',
        event: 'COURT_SUBMIT_DEFENSE',
        payload
      }).catch(() => {});
    }

    setHasSubmitted(true);
  };

  const handleLeaveRoom = async () => {
    if (channelRef.current) {
      try {
        await channelRef.current.untrack();
        await channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
      } catch {}
    }
    clearPlayerSession(roomCode);
    if (onLeaveRoom) {
      onLeaveRoom();
    } else {
      window.location.href = '/';
    }
  };

  const handleLeave = handleLeaveRoom;

  // Current player's evaluation
  const myEval = verdict?.evaluations?.find((e) => e.playerId === playerId);
  const isMyWinner = verdict?.winnerPlayerId === playerId;
  const peerEvals = verdict?.evaluations?.filter((e) => e.playerId !== playerId) || [];

  const sortedLeaderboard = Object.values(scores).sort((a, b) => b.totalScore - a.totalScore);
  const myScoreRank = sortedLeaderboard.findIndex((s) => s.playerId === playerId) + 1;
  const podiumWinner = sortedLeaderboard[0];
  const podiumLoser = sortedLeaderboard.length > 1 ? sortedLeaderboard[sortedLeaderboard.length - 1] : null;

  if (phase === 'LOBBY') {
    return (
      <UnifiedShabahLobby
        roomCode={roomCode}
        gameId="ai-lawyer"
        gameTitle="شبح القاضي"
        players={[{ id: playerId, name: playerName, isReady }]}
        role="contestant"
        currentPlayerId={playerId}
        isReady={isReady}
        onToggleReady={handleToggleReady}
        onExit={handleLeaveRoom}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#000000] font-sans select-none" dir="rtl">
      <MobileTopBar roomCode={roomCode} playerName={playerName} onLeaveRoom={handleLeaveRoom} />
      {/* TopBar with strict Ochre buttons */}
      <CourtTopBar
        roomCode={roomCode}
        phase={phase}
        onLeaveRoom={handleLeave}
      />

      <div className="flex-1 overflow-hidden p-4">
        {/* 1. LOBBY PHASE */}
        {false && (
          <div className="flex flex-col h-full justify-between">
            <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl p-6 text-center mt-3">
              <span className="text-xs font-bold text-[#5C4033] block mb-1">المتهم الحاضر:</span>
              <h2 className="text-2xl font-black text-[#2C2A29] mb-3">{playerName}</h2>
              <div className="inline-flex p-3 bg-[#E5E0D5] border-2 border-[#2C2A29] rounded-2xl mb-4">
                <Scale className="text-[#8A9A5B]" size={36} />
              </div>
              <p className="text-sm font-bold text-[#5C4033] mb-4">
                اضغط "أنا جاهز" لبدء عداد المحاكمة التلقائي (3 ثوانٍ) فور اكتمال الجاهزية!
              </p>

              <button
                onClick={handleToggleReady}
                className={`w-full py-4 rounded-xl border-2 border-[#2C2A29] font-black text-lg shadow-[4px_4px_0px_#2C2A29] transition-all active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-2 ${
                  isReady
                    ? 'bg-[#8A9A5B] text-white hover:bg-[#73834A]'
                    : 'bg-white text-[#2C2A29] hover:bg-[#F7F4EC]'
                }`}
              >
                {isReady && <Check size={20} className="stroke-[3]" />}
                <span>{isReady ? 'أنت جاهز ✓ (اضغط للإلغاء)' : 'أنا جاهز للمحاكمة'}</span>
              </button>
            </div>

            <div className="bg-white border-2 border-[#2C2A29] rounded-xl p-3.5 text-center">
              <span className="text-xs font-bold text-[#5C4033] block mb-0.5">توجيهات المحكمة:</span>
              <p className="text-xs font-black text-[#2C2A29]">
                استعد لـ 3 قضايا توريطية.. رقع لنفسك بذكاء والقاضي يكشف التسليك!
              </p>
            </div>
          </div>
        )}

        {/* 2. CASE BRIEF PHASE */}
        {phase === 'CASE_BRIEF' && (
          <div className="flex flex-col h-full justify-between">
            <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl p-5 mt-2">
              <div className="flex justify-between items-center mb-2">
                <span className={`text-xs font-black px-2.5 py-0.5 rounded border border-[#2C2A29] ${
                  isTieBreaker ? 'bg-[#B85C5C] text-white animate-pulse' : 'bg-[#C68B59] text-white'
                }`}>
                  {isTieBreaker ? '⚖️ القضية الفاصلة' : `الجولة ${currentRound} من 3`}
                </span>
                <span className="text-xs font-bold text-[#5C4033]">حيثيات القضية</span>
              </div>

              <h2 className="text-xl font-black text-[#2C2A29] mb-3">
                {courtCase.title}
              </h2>

              <div className="bg-white border-2 border-[#2C2A29] rounded-xl p-3 mb-3">
                <span className="text-[11px] font-black text-[#C68B59] block mb-1">
                  التهمة الرسمية:
                </span>
                <p className="text-sm font-black text-[#2C2A29] leading-relaxed">
                  {courtCase.charge}
                </p>
              </div>

              <div className="bg-[#E5E0D5]/50 border border-[#2C2A29]/20 rounded-xl p-3">
                <span className="text-[11px] font-bold text-[#5C4033] block mb-0.5">
                  تفاصيل الموقف:
                </span>
                <p className="text-xs font-bold text-[#5C4033] leading-relaxed">
                  {courtCase.context}
                </p>
              </div>
            </div>

            <div className="bg-[#8A9A5B]/15 border-2 border-[#8A9A5B] rounded-xl p-3 text-center">
              <p className="text-xs font-black text-[#2C2A29]">
                طالع الشاشة الكبيرة.. واستعد لكتابة عذرك بعد قليل!
              </p>
            </div>
          </div>
        )}

        {/* 3. DEFENSE INPUT PHASE */}
        {phase === 'DEFENSE_INPUT' && (
          <div className="flex flex-col h-full justify-between">
            <div>
              {/* Sticky Case Brief Header */}
              <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-2xl p-3 mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded border border-[#2C2A29] ${
                    isTieBreaker ? 'bg-[#B85C5C] text-white animate-pulse' : 'bg-[#C68B59] text-white'
                  }`}>
                    {isTieBreaker ? '⚖️ قضية فاصلة' : `الجولة ${currentRound} من 3`}
                  </span>
                  <span className="text-[10px] font-bold text-[#5C4033]">التهمة الموجهة لك</span>
                </div>
                <h3 className="text-sm font-black text-[#2C2A29] leading-snug">
                  {courtCase.charge}
                </h3>
              </div>

              {hasSubmitted ? (
                <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl p-6 text-center">
                  <div className="inline-flex p-3 bg-[#8A9A5B]/20 border-2 border-[#8A9A5B] rounded-2xl mb-3">
                    <Check className="text-[#8A9A5B]" size={36} />
                  </div>
                  <h3 className="text-lg font-black text-[#2C2A29] mb-1">
                    تم تسليم مرافعتك للقاضي ✓
                  </h3>
                  <p className="text-xs font-bold text-[#5C4033] mb-4">
                    بانتظار تسليم باقي المتهمين لينعقد صك الحكم فوراً...
                  </p>

                  <div className="bg-white border-2 border-[#2C2A29] rounded-xl p-3 text-right">
                    <span className="text-[11px] font-bold text-[#5C4033] block mb-1">
                      عذرك المسجل:
                    </span>
                    <p className="text-sm font-black text-[#2C2A29] leading-relaxed break-words whitespace-pre-wrap">
                      "{argumentText}"
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl p-4">
                  <label className="block text-xs font-black text-[#2C2A29] mb-2">
                    اكتب دفاعك/عذرك القانوني هنا.. أقنع القاضي ورقع لنفسك بذكاء:
                  </label>
                  <textarea
                    rows={5}
                    value={argumentText}
                    onChange={(e) => setArgumentText(e.target.value)}
                    placeholder="مثال: سيارتي بنشرت بالدائري والجوال طفى شحن ومالقيت شاحن..."
                    className="w-full p-3 rounded-xl border-2 border-[#2C2A29] bg-white text-[#2C2A29] font-bold text-sm focus:outline-none resize-none leading-relaxed"
                  />
                  <div className="flex justify-between items-center mt-2 text-[11px] font-bold text-[#5C4033]">
                    <span>تلميح: تجنب الدراما الزايدة والتسليك المفضوح!</span>
                    <span>{argumentText.length} حرف</span>
                  </div>
                </div>
              )}
            </div>

            {!hasSubmitted && (
              <button
                onClick={handleSubmitDefense}
                disabled={!argumentText.trim()}
                className="w-full py-4 bg-[#8A9A5B] text-white border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-xl font-black text-lg disabled:opacity-50 active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-2 hover:bg-[#2C2A29]"
              >
                <Send size={18} />
                <span>تقديم المرافعة للقاضي</span>
              </button>
            )}
          </div>
        )}

        {/* 4. JUDGE DELIBERATION PHASE */}
        {phase === 'JUDGE_DELIBERATION' && (
          <div className="flex-1 flex items-center justify-center text-center p-6 bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl h-full">
            <div>
              <div className="inline-flex p-4 bg-[#E5E0D5] border-2 border-[#2C2A29] rounded-2xl mb-4">
                <Gavel className="text-[#8A9A5B]" size={42} />
              </div>
              <h3 className="text-xl font-black text-[#2C2A29] mb-2">
                القاضي يفحص الأعذار...
              </h3>
              <p className="text-sm font-bold text-[#5C4033] leading-relaxed">
                يكشف التسليك بالعبادات، يجلد الدراما الزايدة، ويصدر صك الحكم والأختام!
              </p>
            </div>
          </div>
        )}

        {/* 5. VERDICT REVEAL PHASE (Dynamic Height Scrollable List) */}
        {phase === 'VERDICT_REVEAL' && verdict && (
          <div className="flex flex-col h-full bg-[#E5E0D5] overflow-y-auto space-y-3 pb-6" dir="rtl">
            {/* Header / Round info */}
            <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl p-3 text-center">
              <div className="flex justify-between items-center mb-1">
                <span className={`text-xs font-black px-2.5 py-0.5 rounded border border-[#2C2A29] ${
                  isTieBreaker ? 'bg-[#B85C5C] text-white animate-pulse' : 'bg-[#C68B59] text-white'
                }`}>
                  {isTieBreaker ? '⚖️ نتيجة القضية الفاصلة' : `الجولة ${currentRound} من 3`}
                </span>
                <h2 className="text-sm font-black text-[#2C2A29]">صك الحكم القضائي</h2>
              </div>
              <p className="text-xs font-bold text-[#5C4033] leading-relaxed">{verdict.judgeSummary}</p>
            </div>

            {/* Render Cards Dynamically: Personal Card First */}
            {myEval && (
              <div className="border-2 border-[#8A9A5B] rounded-2xl p-1 bg-[#8A9A5B]/10">
                <span className="text-[11px] font-black text-[#8A9A5B] block px-2 py-0.5 mb-1">
                  مرافعتك وحكم القاضي عليك:
                </span>
                <VerdictStampCard
                  evaluation={myEval}
                  isWinner={isMyWinner}
                />
              </div>
            )}

            {/* Peer Verdict Cards */}
            {peerEvals.length > 0 && (
              <div className="space-y-3">
                <span className="text-[11px] font-black text-[#5C4033] block px-1">
                  أحكام القاضي على باقي المتهمين:
                </span>
                {peerEvals.map((ev) => (
                  <VerdictStampCard
                    key={ev.playerId}
                    evaluation={ev}
                    isWinner={ev.playerId === verdict.winnerPlayerId}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 6. MATCH PODIUM PHASE (Championship Finale on Mobile) */}
        {phase === 'MATCH_PODIUM' && (
          <div className="flex flex-col h-full justify-between">
            <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl p-4 text-center mt-2">
              <div className="inline-flex p-2.5 bg-[#E5E0D5] border-2 border-[#2C2A29] rounded-2xl mb-2">
                <Crown className="text-[#8A9A5B]" size={32} />
              </div>
              <h2 className="text-xl font-black text-[#2C2A29] mb-1">
                منصة التتويج النهائية
              </h2>
              <p className="text-xs font-bold text-[#5C4033]">
                ترتيبك النهائي: #{myScoreRank} بمجموع {scores[playerId]?.totalScore || 0} pt
              </p>
            </div>

            {/* Winner / Loser Highlights */}
            <div className="space-y-2.5 my-3">
              {podiumWinner && (
                <div className="bg-[#8A9A5B]/15 border-2 border-[#8A9A5B] shadow-[2px_2px_0px_#8A9A5B] rounded-xl p-3 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Trophy className="text-[#8A9A5B]" size={20} />
                    <div>
                      <span className="text-[10px] font-black text-[#8A9A5B] block">🥇 محامي الجلسة الأول</span>
                      <span className="text-sm font-black text-[#2C2A29]">{podiumWinner.playerName}</span>
                    </div>
                  </div>
                  <span className="text-base font-black text-[#2C2A29]">{podiumWinner.totalScore} pt</span>
                </div>
              )}

              {podiumLoser && (
                <div className="bg-[#B85C5C]/15 border-2 border-[#B85C5C] shadow-[2px_2px_0px_#B85C5C] rounded-xl p-3 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Frown className="text-[#B85C5C]" size={20} />
                    <div>
                      <span className="text-[10px] font-black text-[#B85C5C] block">🤡 أفشل مرقع</span>
                      <span className="text-sm font-black text-[#2C2A29]">{podiumLoser.playerName}</span>
                    </div>
                  </div>
                  <span className="text-base font-black text-[#2C2A29]">{podiumLoser.totalScore} pt</span>
                </div>
              )}
            </div>

            {/* Standings List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
              {sortedLeaderboard.map((ps, idx) => (
                <div
                  key={ps.playerId}
                  className={`border-2 border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29] rounded-xl p-2.5 flex justify-between items-center ${
                    ps.playerId === playerId ? 'bg-[#8A9A5B]/15 border-[#8A9A5B]' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#E5E0D5] border border-[#2C2A29] flex items-center justify-center font-black text-xs">
                      #{idx + 1}
                    </span>
                    <span className="font-black text-sm text-[#2C2A29]">{ps.playerName}</span>
                    {ps.playerId === playerId && (
                      <span className="text-[10px] font-black text-[#8A9A5B]">(أنت)</span>
                    )}
                  </div>
                  <span className="text-sm font-black text-[#2C2A29]">{ps.totalScore} pt</span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-white border-2 border-[#2C2A29] rounded-xl text-center mt-2">
              <p className="text-xs font-bold text-[#5C4033]">
                بانتظار المضيف لإطلاق محاكمة جديدة من التلفزيون...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
