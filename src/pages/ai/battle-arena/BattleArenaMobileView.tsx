// src/pages/ai/battle-arena/BattleArenaMobileView.tsx
import React, { useState, useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  Swords,
  Shield,
  Zap,
  Clock,
  Trophy,
  Check,
  Send,
  Crown,
  Frown,
  Users,
  Flame,
  Award
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { BattleTopBar } from './components/BattleTopBar';
import {
  BattlePhase,
  PlayerLoadout,
  DuelClashResult,
  BattleScore
} from './types';

interface BattleArenaMobileViewProps {
  roomCode: string;
  playerId: string;
  playerName: string;
  channel?: RealtimeChannel;
  onLeaveRoom?: () => void;
}

export const BattleArenaMobileView: React.FC<BattleArenaMobileViewProps> = ({
  roomCode,
  playerId,
  playerName,
  onLeaveRoom
}) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef<boolean>(false);

  // Core Phase & Matchmaking State
  const [phase, setPhase] = useState<BattlePhase>('LOBBY');
  const [timeLeft, setTimeLeft] = useState<number>(50);
  const [isReady, setIsReady] = useState(false);

  // Loadout fields
  const [weapon, setWeapon] = useState('');
  const [defense, setDefense] = useState('');
  const [superpower, setSuperpower] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Duel and Bracket State
  const [duelQueue, setDuelQueue] = useState<[PlayerLoadout, PlayerLoadout][]>([]);
  const [currentDuel, setCurrentDuel] = useState<[PlayerLoadout, PlayerLoadout] | null>(null);
  const [duelNumber, setDuelNumber] = useState(1);
  const [totalDuels, setTotalDuels] = useState(1);
  const [currentResult, setCurrentResult] = useState<DuelClashResult | null>(null);
  const [scores, setScores] = useState<Record<string, BattleScore>>({});

  // Broadcast Helper
  const broadcastEvent = async (event: string, payload: any) => {
    if (!channelRef.current || !isSubscribedRef.current) return;
    try {
      await channelRef.current.send({
        type: 'broadcast',
        event,
        payload
      });
    } catch (err) {
      console.warn(`[Mobile Battle] Error broadcasting ${event}:`, err);
    }
  };

  // Definitive Stable Channel Lifecycle (Strictly [roomCode] dependency)
  useEffect(() => {
    const normalizedCode = (roomCode || '').trim().toUpperCase();
    if (!normalizedCode) return;
    const channelName = `battle:${normalizedCode}`;

    if (channelRef.current) {
      console.log(`[Mobile Battle] Removing existing channel before initialization: ${channelName}`);
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log(`[Mobile Battle] Initializing channel: ${channelName}`);
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
          alert('تم استبعادك من الحلبة');
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
      .on('broadcast', { event: 'BATTLE_PHASE_CHANGE' }, ({ payload }) => {
        if (!payload) return;
        if (payload.phase) {
          setPhase(payload.phase);
          if (payload.phase === 'LOADOUT_INPUT') {
            setHasSubmitted(false);
            setWeapon('');
            setDefense('');
            setSuperpower('');
            setCurrentResult(null);
          } else if (payload.phase === 'LOBBY') {
            setHasSubmitted(false);
            setIsReady(false);
            setCurrentResult(null);
          }
        }
        if (typeof payload.duration === 'number') setTimeLeft(payload.duration);
        if (payload.duelQueue) setDuelQueue(payload.duelQueue);
        if (payload.currentDuel) setCurrentDuel(payload.currentDuel);
        if (typeof payload.duelNumber === 'number') setDuelNumber(payload.duelNumber);
        if (typeof payload.totalDuels === 'number') setTotalDuels(payload.totalDuels);
        if (payload.scores) setScores(payload.scores);
      })
      .on('broadcast', { event: 'BATTLE_DUEL_RESULT' }, ({ payload }) => {
        if (!payload) return;
        if (payload.clashResult) setCurrentResult(payload.clashResult);
        if (payload.scores) setScores(payload.scores);
        setPhase('DUEL_RESULT');
      })
      .on('broadcast', { event: 'RETURN_TO_LOBBY' }, () => {
        setPhase('LOBBY');
        setHasSubmitted(false);
        setIsReady(false);
        setWeapon('');
        setDefense('');
        setSuperpower('');
        setCurrentResult(null);
        setCurrentDuel(null);
      })
      .on('broadcast', { event: 'BATTLE_ROOM_STATE_SYNC' }, ({ payload }) => {
        if (!payload) return;
        if (payload.phase) setPhase(payload.phase);
        if (typeof payload.timeLeft === 'number') setTimeLeft(payload.timeLeft);
        if (payload.currentDuel) setCurrentDuel(payload.currentDuel);
        if (payload.currentResult) setCurrentResult(payload.currentResult);
        if (payload.scores) setScores(payload.scores);
        if (Array.isArray(payload.readyPlayerIds)) {
          setIsReady(payload.readyPlayerIds.includes(playerId));
        }
      });

    // Subscribe ONCE with safe status logging
    channel.subscribe((status) => {
      console.log(`[Mobile Battle Channel]: ${status}`);
      if (status === 'SUBSCRIBED') {
        isSubscribedRef.current = true;
        // Announce presence & request current room state
        channel.send({
          type: 'broadcast',
          event: 'PLAYER_JOIN',
          payload: { player: { id: playerId, name: playerName } }
        }).catch(() => {});
        channel.send({
          type: 'broadcast',
          event: 'REQUEST_ROOM_STATE',
          payload: {}
        }).catch(() => {});
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        isSubscribedRef.current = false;
      }
    });

    return () => {
      console.log(`[Mobile Battle] Cleaning up channel: ${channelName}`);
      isSubscribedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomCode, playerId, playerName]);

  // Toggle ready status in LOBBY
  const handleToggleReady = () => {
    const nextState = !isReady;
    setIsReady(nextState);
    broadcastEvent('PLAYER_READY_TOGGLE', {
      playerId,
      isReady: nextState
    });
  };

  // Submit Loadout
  const handleSubmitLoadout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weapon.trim() || !defense.trim() || !superpower.trim()) return;

    broadcastEvent('SUBMIT_LOADOUT', {
      playerId,
      playerName,
      weapon: weapon.trim().slice(0, 45),
      defense: defense.trim().slice(0, 45),
      superpower: superpower.trim().slice(0, 60)
    });
    setHasSubmitted(true);
  };

  // Check if player is one of the fighters in current duel
  const isPlayerFighter = currentDuel
    ? currentDuel[0].playerId === playerId || currentDuel[1].playerId === playerId
    : false;

  const myFighter = currentDuel
    ? currentDuel[0].playerId === playerId
      ? currentDuel[0]
      : currentDuel[1].playerId === playerId
      ? currentDuel[1]
      : null
    : null;

  const opponentFighter = currentDuel
    ? currentDuel[0].playerId === playerId
      ? currentDuel[1]
      : currentDuel[1].playerId === playerId
      ? currentDuel[0]
      : null
    : null;

  // Sorted leaderboard
  const sortedScores = Object.values(scores).sort((a, b) => b.totalScore - a.totalScore);
  const myRank = sortedScores.findIndex((s) => s.playerId === playerId) + 1;
  const myScore = scores[playerId]?.totalScore || 0;

  return (
    <div
      className="min-h-screen bg-[#E5E0D5] flex flex-col font-sans select-none"
      dir="rtl"
      style={{
        backgroundImage: 'radial-gradient(#2C2A29 0.75px, transparent 0.75px)',
        backgroundSize: '24px 24px'
      }}
    >
      <BattleTopBar
        roomCode={roomCode}
        phase={phase}
        onLeaveRoom={onLeaveRoom}
        isHost={false}
      />

      <main className="flex-1 max-w-md w-full mx-auto p-4 flex flex-col justify-start">
        {/* PHASE 1: LOBBY */}
        {phase === 'LOBBY' && (
          <div className="flex-1 flex flex-col justify-center items-center gap-6 text-center py-6">
            <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl p-6 w-full">
              <div className="w-16 h-16 bg-[#8A9A5B]/20 border-2 border-[#2C2A29] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Swords className="text-[#8A9A5B]" size={32} />
              </div>

              <h2 className="text-2xl font-black text-[#2C2A29] mb-1">حرب المصارعة</h2>
              <p className="text-xs text-[#5C4033] font-bold mb-4">
                جهّز سلاحك، درعك، وقوتك الخارقة.. والـ AI يحسم الفائز!
              </p>

              <div className="bg-white border-2 border-[#2C2A29] rounded-xl p-3 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#5C4033] font-bold">اسمك بالحلبة:</span>
                  <span className="font-black text-[#2C2A29]">{playerName}</span>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-lg font-black border-2 border-[#2C2A29] ${
                    isReady ? 'bg-[#8A9A5B] text-white' : 'bg-[#E5E0D5] text-[#2C2A29]'
                  }`}
                >
                  {isReady ? 'جاهز' : 'غير جاهز'}
                </span>
              </div>

              <button
                onClick={handleToggleReady}
                className={`w-full py-4 rounded-xl border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] font-black text-lg transition-transform active:translate-y-0.5 cursor-pointer ${
                  isReady
                    ? 'bg-[#B85C5C] text-white hover:bg-[#964242]'
                    : 'bg-[#8A9A5B] text-white hover:bg-[#6e7d43]'
                }`}
              >
                {isReady ? 'إلغاء الجاهزية' : 'أنا جاهز للقتال!'}
              </button>

              <p className="text-[11px] text-[#5C4033] font-bold mt-4">
                {isReady
                  ? 'في انتظار باقي المصارعين أو بدء الجولة من الشاشة...'
                  : 'اضغط جاهز عندما تكون مستعداً للانطلاق!'}
              </p>
            </div>
          </div>
        )}

        {/* PHASE 2: LOADOUT_INPUT */}
        {phase === 'LOADOUT_INPUT' && (
          <div className="flex-1 flex flex-col gap-4 py-2">
            {!hasSubmitted ? (
              <form onSubmit={handleSubmitLoadout} className="flex flex-col gap-3">
                <div className="flex items-center justify-between bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Swords size={18} className="text-[#8A9A5B]" />
                    <span className="font-black text-sm text-[#2C2A29]">تجهيز العتاد القتالي</span>
                  </div>
                  {timeLeft > 0 && (
                    <div className="flex items-center gap-1 text-xs font-black text-[#C68B59]">
                      <Clock size={14} />
                      <span>{timeLeft} ثانية</span>
                    </div>
                  )}
                </div>

                {/* Field 1: سلاحك */}
                <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl p-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-[#2C2A29] flex items-center gap-1.5">
                      <Swords size={14} className="text-[#8A9A5B]" />
                      <span>1. سلاحك الهجومي</span>
                    </label>
                    <span className="text-[10px] text-[#5C4033] font-bold">{weapon.length}/45</span>
                  </div>
                  <input
                    type="text"
                    maxLength={45}
                    value={weapon}
                    onChange={(e) => setWeapon(e.target.value)}
                    placeholder="مثال: ساطور مشحوذ، مكنسة كهربائية، كرتون حليب منتهي..."
                    className="w-full bg-white border-2 border-[#2C2A29] rounded-lg px-3 py-2 text-sm text-[#2C2A29] font-bold placeholder-[#5C4033]/50 focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]"
                  />
                </div>

                {/* Field 2: أداة دفاعك */}
                <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl p-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-[#2C2A29] flex items-center gap-1.5">
                      <Shield size={14} className="text-[#C68B59]" />
                      <span>2. أداة دفاعك</span>
                    </label>
                    <span className="text-[10px] text-[#5C4033] font-bold">{defense.length}/45</span>
                  </div>
                  <input
                    type="text"
                    maxLength={45}
                    value={defense}
                    onChange={(e) => setDefense(e.target.value)}
                    placeholder="مثال: صينية ميرندا استيل، بطانية شتوية دبل، كيس بصل..."
                    className="w-full bg-white border-2 border-[#2C2A29] rounded-lg px-3 py-2 text-sm text-[#2C2A29] font-bold placeholder-[#5C4033]/50 focus:outline-none focus:ring-2 focus:ring-[#C68B59]"
                  />
                </div>

                {/* Field 3: قوتك الخارقة */}
                <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl p-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-[#2C2A29] flex items-center gap-1.5">
                      <Zap size={14} className="text-[#8A9A5B]" />
                      <span>3. قوتك الخارقة</span>
                    </label>
                    <span className="text-[10px] text-[#5C4033] font-bold">{superpower.length}/60</span>
                  </div>
                  <input
                    type="text"
                    maxLength={60}
                    value={superpower}
                    onChange={(e) => setSuperpower(e.target.value)}
                    placeholder="مثال: إذا عصب يطير رمل، يكب زيت سيارات على الأرض..."
                    className="w-full bg-white border-2 border-[#2C2A29] rounded-lg px-3 py-2 text-sm text-[#2C2A29] font-bold placeholder-[#5C4033]/50 focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!weapon.trim() || !defense.trim() || !superpower.trim()}
                  className="w-full mt-2 py-3.5 bg-[#8A9A5B] disabled:opacity-50 disabled:cursor-not-allowed text-white border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-xl font-black text-base flex items-center justify-center gap-2 hover:bg-[#6e7d43] active:translate-y-0.5 cursor-pointer"
                >
                  <Send size={18} />
                  <span>دخول الحلبة بهذا العتاد</span>
                </button>
              </form>
            ) : (
              <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl p-6 text-center flex flex-col gap-4 my-auto">
                <div className="w-16 h-16 bg-[#8A9A5B]/20 border-2 border-[#2C2A29] rounded-full flex items-center justify-center mx-auto">
                  <Check className="text-[#8A9A5B]" size={32} />
                </div>
                <h3 className="text-xl font-black text-[#2C2A29]">تم تثبيت عتادك القتالي!</h3>
                <p className="text-xs text-[#5C4033] font-bold">
                  أنت الآن جاهز في قائمة المقاتلين. في انتظار انتهاء الوقت لانطلاق النزالات!
                </p>

                <div className="bg-white border-2 border-[#2C2A29] rounded-xl p-4 text-right flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 text-xs">
                    <Swords size={14} className="text-[#8A9A5B] shrink-0" />
                    <span className="text-[#5C4033] font-bold">السلاح:</span>
                    <span className="font-black text-[#2C2A29]">{weapon}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Shield size={14} className="text-[#C68B59] shrink-0" />
                    <span className="text-[#5C4033] font-bold">الدفاع:</span>
                    <span className="font-black text-[#2C2A29]">{defense}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Zap size={14} className="text-[#8A9A5B] shrink-0" />
                    <span className="text-[#5C4033] font-bold">القوة:</span>
                    <span className="font-black text-[#2C2A29]">{superpower}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PHASE 3: MATCHMAKING_TREE */}
        {phase === 'MATCHMAKING_TREE' && (
          <div className="flex-1 flex flex-col gap-4 py-4 text-center">
            <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl p-6">
              <div className="w-14 h-14 bg-[#C68B59]/20 border-2 border-[#2C2A29] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Users size={28} className="text-[#C68B59]" />
              </div>
              <h3 className="text-xl font-black text-[#2C2A29] mb-1">جدول النزالات 1v1</h3>
              <p className="text-xs text-[#5C4033] font-bold mb-4">
                تابع شاشة التلفزيون لمشاهدة قرعة المواجهات المباشرة!
              </p>

              {duelQueue.length > 0 && (
                <div className="flex flex-col gap-2 text-right">
                  {duelQueue.map((duel, idx) => {
                    const isMyMatch = duel[0].playerId === playerId || duel[1].playerId === playerId;
                    return (
                      <div
                        key={idx}
                        className={`border-2 border-[#2C2A29] rounded-xl p-3 flex items-center justify-between text-xs font-black ${
                          isMyMatch ? 'bg-[#8A9A5B]/15 border-[#8A9A5B]' : 'bg-white'
                        }`}
                      >
                        <span className="text-[#5C4033]">نزال #{idx + 1}</span>
                        <div className="flex items-center gap-2 text-[#2C2A29]">
                          <span>{duel[0].playerName}</span>
                          <span className="text-[#B85C5C]">ضد</span>
                          <span>{duel[1].playerName}</span>
                        </div>
                        {isMyMatch && (
                          <span className="text-[10px] bg-[#8A9A5B] text-white px-2 py-0.5 rounded font-bold">
                            نزالك!
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PHASE 4: DUEL_CLASH */}
        {phase === 'DUEL_CLASH' && (
          <div className="flex-1 flex flex-col gap-4 py-4 text-center justify-center">
            {isPlayerFighter ? (
              <div className="bg-[#F7F4EC] border-2 border-[#8A9A5B] shadow-[4px_4px_0px_#8A9A5B] rounded-2xl p-6 flex flex-col gap-4">
                <div className="w-16 h-16 bg-[#8A9A5B]/20 border-2 border-[#8A9A5B] rounded-full flex items-center justify-center mx-auto">
                  <Flame size={32} className="text-[#8A9A5B]" />
                </div>
                <div>
                  <span className="text-xs bg-[#8A9A5B] text-white px-3 py-1 rounded-full font-black">
                    أنت داخل الحلبة الآن!
                  </span>
                  <h3 className="text-2xl font-black text-[#2C2A29] mt-2">
                    {myFighter?.playerName} ضد {opponentFighter?.playerName}
                  </h3>
                  <p className="text-xs text-[#5C4033] font-bold mt-1">
                    نزال #{duelNumber} من أصل {totalDuels}
                  </p>
                </div>

                <div className="bg-white border-2 border-[#2C2A29] rounded-xl p-4 text-right flex flex-col gap-3">
                  <div>
                    <span className="text-[11px] font-black text-[#5C4033] block mb-1">خصمك في النزال:</span>
                    <span className="text-sm font-black text-[#2C2A29]">{opponentFighter?.playerName}</span>
                  </div>
                  <div className="text-xs flex flex-col gap-1.5 pt-2 border-t border-[#2C2A29]/15">
                    <div className="flex items-center gap-2">
                      <Swords size={14} className="text-[#8A9A5B] shrink-0" />
                      <span className="text-[#5C4033] font-bold">سلاحه:</span>
                      <span className="font-bold text-[#2C2A29]">{opponentFighter?.weapon}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield size={14} className="text-[#C68B59] shrink-0" />
                      <span className="text-[#5C4033] font-bold">دفاعه:</span>
                      <span className="font-bold text-[#2C2A29]">{opponentFighter?.defense}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-[#8A9A5B] shrink-0" />
                      <span className="text-[#5C4033] font-bold">قوته:</span>
                      <span className="font-bold text-[#2C2A29]">{opponentFighter?.superpower}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[#5C4033] font-black">
                  الـ AI يحلل تصادم العتاد الفيزيائي على شاشة التلفزيون...
                </p>
              </div>
            ) : (
              <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl p-6 flex flex-col gap-4">
                <div className="w-14 h-14 bg-[#C68B59]/20 border-2 border-[#2C2A29] rounded-2xl flex items-center justify-center mx-auto">
                  <Swords size={28} className="text-[#C68B59]" />
                </div>
                <div>
                  <span className="text-xs bg-[#E5E0D5] text-[#2C2A29] px-3 py-1 rounded-full font-black border-2 border-[#2C2A29]">
                    نزال مباشر جاري الآن
                  </span>
                  <h3 className="text-xl font-black text-[#2C2A29] mt-2">
                    {currentDuel ? `${currentDuel[0].playerName} ضد ${currentDuel[1].playerName}` : 'نزال 1v1'}
                  </h3>
                  <p className="text-xs text-[#5C4033] font-bold mt-1">
                    تابع شاشة التلفزيون لمشاهدة سيناريو الاشتباك!
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PHASE 5: DUEL_RESULT */}
        {phase === 'DUEL_RESULT' && currentResult && (
          <div className="flex-1 flex flex-col gap-4 py-4 text-center justify-center">
            {currentResult.winnerPlayerId === playerId ? (
              <div className="bg-[#F7F4EC] border-2 border-[#8A9A5B] shadow-[4px_4px_0px_#8A9A5B] rounded-2xl p-6 flex flex-col gap-3">
                <div className="w-16 h-16 bg-[#8A9A5B]/20 border-2 border-[#8A9A5B] rounded-full flex items-center justify-center mx-auto">
                  <Crown size={32} className="text-[#8A9A5B]" />
                </div>
                <div className="inline-block mx-auto bg-[#8A9A5B] text-white px-4 py-1.5 rounded-full font-black text-sm">
                  فوز مستحق! (+5 pt)
                </div>
                <h3 className="text-2xl font-black text-[#2C2A29]">أنت بطل هذا النزال!</h3>
              </div>
            ) : (currentResult.fighterA.playerId === playerId || currentResult.fighterB.playerId === playerId) ? (
              <div className="bg-[#F7F4EC] border-2 border-[#B85C5C] shadow-[4px_4px_0px_#B85C5C] rounded-2xl p-6 flex flex-col gap-3">
                <div className="w-16 h-16 bg-[#B85C5C]/20 border-2 border-[#B85C5C] rounded-full flex items-center justify-center mx-auto">
                  <Frown size={32} className="text-[#B85C5C]" />
                </div>
                <div className="inline-block mx-auto bg-[#B85C5C] text-white px-4 py-1.5 rounded-full font-black text-sm">
                  هاردلك! كسبت (+1 pt)
                </div>
                <h3 className="text-2xl font-black text-[#2C2A29]">سقطت في الحلبة!</h3>
              </div>
            ) : (
              <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl p-6 flex flex-col gap-3">
                <div className="w-14 h-14 bg-[#8A9A5B]/20 border-2 border-[#2C2A29] rounded-full flex items-center justify-center mx-auto">
                  <Award size={28} className="text-[#8A9A5B]" />
                </div>
                <div className="inline-block mx-auto bg-[#8A9A5B] text-white px-3 py-1 rounded-full font-black text-xs">
                  الفائز: {currentResult.winnerName} (+5 pt)
                </div>
                <h3 className="text-xl font-black text-[#2C2A29]">حسم النزال</h3>
              </div>
            )}

            {/* Clash Story Card */}
            <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl p-4 text-right flex flex-col gap-2">
              <span className="text-xs font-black text-[#5C4033]">سيناريو الاشتباك:</span>
              <p className="text-sm font-bold text-[#2C2A29] leading-relaxed">
                {currentResult.clashStory}
              </p>
              <div className="mt-2 pt-2 border-t border-[#2C2A29]/15 flex items-start gap-1.5">
                <span className="text-xs font-black text-[#C68B59] shrink-0">سبب الحسم:</span>
                <span className="text-xs font-bold text-[#2C2A29]">{currentResult.decidingFactor}</span>
              </div>
            </div>

            <p className="text-xs text-[#5C4033] font-bold">
              تابع الشاشة للانتقال للنزال التالي أو منصة التتويج...
            </p>
          </div>
        )}

        {/* PHASE 6: TOURNAMENT_PODIUM */}
        {phase === 'TOURNAMENT_PODIUM' && (
          <div className="flex-1 flex flex-col gap-4 py-4">
            <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl p-5 text-center flex flex-col gap-3">
              <div className="w-16 h-16 bg-[#8A9A5B]/20 border-2 border-[#2C2A29] rounded-2xl flex items-center justify-center mx-auto">
                <Trophy size={32} className="text-[#8A9A5B]" />
              </div>
              <h2 className="text-2xl font-black text-[#2C2A29]">منصة تتويج الحلبة</h2>
              <p className="text-xs text-[#5C4033] font-bold">
                ترتيبك النهائي: المركز {myRank > 0 ? `#${myRank}` : '-'} برصيد {myScore} pt
              </p>

              {/* Leaderboard Table */}
              <div className="flex flex-col gap-2 text-right mt-2">
                {sortedScores.map((s, idx) => {
                  const isMe = s.playerId === playerId;
                  return (
                    <div
                      key={s.playerId}
                      className={`border-2 border-[#2C2A29] rounded-xl p-3 flex items-center justify-between font-black text-xs ${
                        isMe ? 'bg-[#8A9A5B]/15 border-[#8A9A5B]' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black border-2 border-[#2C2A29] ${
                            idx === 0
                              ? 'bg-[#C68B59] text-white'
                              : idx === 1
                              ? 'bg-[#E5E0D5] text-[#2C2A29]'
                              : 'bg-white text-[#5C4033]'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-[#2C2A29]">{s.playerName}</span>
                        {idx === 0 && <Crown size={14} className="text-[#C68B59]" />}
                        {isMe && (
                          <span className="text-[10px] bg-[#8A9A5B] text-white px-2 py-0.5 rounded font-bold">
                            أنت
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-[#5C4033]">فوز: {s.wins}</span>
                        <span className="text-[#8A9A5B] font-black">{s.totalScore} pt</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
