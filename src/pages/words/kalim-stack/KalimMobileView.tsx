import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, AlertCircle, Sparkles, Layers, ArrowDown, HelpCircle, Trophy } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { MobileTopBar } from '../../../components/MobileTopBar';
import { KalimCard } from './components/KalimCard';
import { StackedBoardSlot } from './components/StackedBoardSlot';
import {
  KalimPhase,
  LetterCard,
  BoardSlot,
  KalimPlayer,
  TurnNotification
} from './types';
import {
  generateStarterBoard,
  generateRandomHand,
  validateKalimPlacement
} from './utils/kalimLexicon';
import { getOrCreatePlayerId, getOrCreatePlayerName } from '../../../utils/playerSession';
import { sound } from '../../../lib/audio';

export const KalimMobileView: React.FC = () => {
  const { code: rawCode } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const roomCode = (rawCode || '000000').toUpperCase();

  // Player identity
  const playerId = useMemo(() => getOrCreatePlayerId(), []);
  const playerName = useMemo(() => getOrCreatePlayerName(), []);

  // Game States
  const [phase, setPhase] = useState<KalimPhase>('LOBBY');
  const [isReady, setIsReady] = useState<boolean>(false);
  const [board, setBoard] = useState<[BoardSlot, BoardSlot, BoardSlot]>(() => generateStarterBoard());
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const [hand, setHand] = useState<LetterCard[]>(() => generateRandomHand(7));
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [players, setPlayers] = useState<KalimPlayer[]>([]);
  const [lastNotification, setLastNotification] = useState<TurnNotification | null>(null);
  const [winner, setWinner] = useState<{ id: string; name: string } | null>(null);

  // Channel ref
  const channelRef = useRef<RealtimeChannel | null>(null);
  const handRef = useRef(hand);
  const isReadyRef = useRef(isReady);
  const boardRef = useRef(board);

  useEffect(() => { handRef.current = hand; }, [hand]);
  useEffect(() => { isReadyRef.current = isReady; }, [isReady]);
  useEffect(() => { boardRef.current = board; }, [board]);

  const isMyTurn = activePlayerId === playerId && phase === 'GAMEPLAY';

  // 1. Setup Supabase Realtime Channel
  useEffect(() => {
    const normalizedCode = roomCode.trim().toUpperCase();
    if (!normalizedCode) return;

    const channel = supabase.channel(`kalim:${normalizedCode}`, {
      config: {
        broadcast: { self: true },
        presence: { key: playerId }
      }
    });
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const active: KalimPlayer[] = [];
        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[];
          presences.forEach((p) => {
            if (p.playerId && p.playerName) {
              active.push({
                id: p.playerId,
                name: p.playerName,
                cardsCount: p.cardsCount ?? 7,
                isReady: !!p.isReady
              });
            }
          });
        });

        // Deduplicate
        const unique = Array.from(new Map(active.map((p) => [p.id, p])).values());
        setPlayers(unique);
      })
      .on('broadcast', { event: 'KALIM_STATE_SYNC' }, ({ payload }) => {
        if (!payload) return;
        if (payload.phase) setPhase(payload.phase);
        if (payload.board) setBoard(payload.board);
        if (payload.activePlayerId !== undefined) setActivePlayerId(payload.activePlayerId);
        if (payload.players) setPlayers(payload.players);
        if (payload.notification) setLastNotification(payload.notification);
        if (payload.phase === 'ROUND_WIN' && payload.players) {
          const w = payload.players.find((p: KalimPlayer) => p.cardsCount === 0);
          if (w) setWinner({ id: w.id, name: w.name });
        }
      })
      .on('broadcast', { event: 'GAME_STARTED' }, ({ payload }) => {
        setPhase('GAMEPLAY');
        if (payload?.board) setBoard(payload.board);
        if (payload?.activePlayerId) setActivePlayerId(payload.activePlayerId);
        // Reset hand to 7 cards on new game start
        const freshHand = generateRandomHand(7);
        setHand(freshHand);
        setSelectedCardId(null);
        setErrorMessage(null);
        sound.playRoundStart();
      })
      .on('broadcast', { event: 'KICK_PLAYER' }, ({ payload }) => {
        if (payload?.playerId === playerId) {
          sessionStorage.clear();
          navigate('/');
        }
      })
      .on('broadcast', { event: 'GAME_TERMINATED' }, () => {
        navigate(`/room/${roomCode}/lobby`);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            playerId,
            playerName,
            cardsCount: handRef.current.length,
            isReady: isReadyRef.current,
            joinedAt: Date.now()
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomCode, playerId, playerName, navigate]);

  // Sync presence when hand or isReady changes
  useEffect(() => {
    if (channelRef.current) {
      channelRef.current.track({
        playerId,
        playerName,
        cardsCount: hand.length,
        isReady,
        joinedAt: Date.now()
      });
    }
  }, [hand.length, isReady, playerId, playerName]);

  // Toggle Ready in Lobby
  const handleToggleReady = () => {
    sound.playClick();
    const nextState = !isReady;
    setIsReady(nextState);
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'PLAYER_READY_TOGGLE',
        payload: { playerId, isReady: nextState }
      });
    }
  };

  // Select Card from hand
  const handleSelectCard = (cardId: string) => {
    sound.playClick();
    setErrorMessage(null);
    setSelectedCardId((prev) => (prev === cardId ? null : cardId));
  };

  // Place card on slot
  const handlePlaceCardOnSlot = (slotIndex: 0 | 1 | 2) => {
    if (!isMyTurn) {
      setErrorMessage('ليس دورك الآن!');
      sound.playIncorrect();
      return;
    }

    if (!selectedCardId) {
      setErrorMessage('اختر كرتاً من يدك أولاً!');
      sound.playIncorrect();
      return;
    }

    const cardToPlay = hand.find((c) => c.id === selectedCardId);
    if (!cardToPlay) return;

    // Validate placement against lexicon
    const validation = validateKalimPlacement(board, slotIndex, cardToPlay.letter);

    if (!validation.isValid) {
      sound.playIncorrect();
      setErrorMessage(validation.errorMessage || 'الحركة غير صالحة!');
      return;
    }

    // Valid move!
    sound.playCorrect();
    setErrorMessage(null);

    // 1. Remove card from local hand
    const nextHand = hand.filter((c) => c.id !== selectedCardId);
    setHand(nextHand);
    setSelectedCardId(null);

    // 2. Broadcast move to TV and players
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'PLAY_CARD_MOVE',
        payload: {
          playerId,
          slotIndex,
          card: cardToPlay
        }
      });
    }
  };

  // Draw penalty card & pass turn
  const handleDrawCard = () => {
    if (!isMyTurn) return;

    sound.playClick();
    setErrorMessage(null);
    setSelectedCardId(null);

    // Draw 1 random card
    const drawn = generateRandomHand(1)[0];
    const nextHand = [...hand, drawn];
    setHand(nextHand);

    // Broadcast draw
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'DRAW_PENALTY_CARD',
        payload: { playerId }
      });
    }
  };

  const selectedCard = useMemo(
    () => hand.find((c) => c.id === selectedCardId),
    [hand, selectedCardId]
  );

  // Divide hand into 2 cascading rows
  const midPoint = Math.ceil(hand.length / 2);
  const row1 = hand.slice(0, midPoint);
  const row2 = hand.slice(midPoint);

  return (
    <div className="min-h-screen bg-[#E5E0D5] flex flex-col font-sans select-none overflow-x-hidden relative" dir="rtl">
      {/* Background static dot texture */}
      <div
        className="fixed inset-0 pointer-events-none opacity-40 z-0"
        style={{
          backgroundImage: 'radial-gradient(#2C2A29 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      />

      {/* Top Bar */}
      <div className="relative z-20">
        <MobileTopBar
          roomCode={roomCode}
          playerName={playerName}
          title="كَلِم"
          onLeaveRoom={() => {
            sessionStorage.clear();
            navigate('/');
          }}
        />
      </div>

      <main className="flex-1 flex flex-col max-w-md w-full mx-auto p-3 relative z-10 justify-between pb-6">
        {/* ================= 1. LOBBY PHASE ================= */}
        {phase === 'LOBBY' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-5 my-auto">
            <div className="w-20 h-20 rounded-3xl bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] flex items-center justify-center text-4xl font-black text-[#8A9A5B]">
              ك
            </div>

            <div>
              <h1 className="text-2xl font-black text-[#2C2A29] tracking-wide">لعبة كَلِم</h1>
              <p className="text-xs font-bold text-[#5C4033] mt-1">
                بدّل حرف، كوّن كلمة ثلاثية معتمدة، وتخلّص من كروتك للفوز!
              </p>
            </div>

            <div className="w-full bg-[#F7F4EC] border-2 border-[#2C2A29] rounded-2xl p-4 shadow-[3px_3px_0px_#2C2A29]">
              <span className="text-xs font-bold text-[#5C4033] block mb-2">اللاعبون المتصلون ({players.length}):</span>
              <div className="flex flex-wrap gap-2 justify-center">
                {players.map((p) => (
                  <span
                    key={p.id}
                    className={`text-xs font-black px-3 py-1 rounded-xl border-2 border-[#2C2A29] ${
                      p.isReady
                        ? 'bg-[#8A9A5B] text-white shadow-[2px_2px_0px_#2C2A29]'
                        : 'bg-[#E5E0D5] text-[#2C2A29]'
                    }`}
                  >
                    {p.name} {p.isReady ? '✓' : ''}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={handleToggleReady}
              className={`w-full py-4 rounded-2xl font-black text-lg border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] transition-all cursor-pointer ${
                isReady
                  ? 'bg-[#8A9A5B] text-white hover:bg-[#78884e]'
                  : 'bg-[#C68B59] text-white hover:bg-[#b07849]'
              }`}
            >
              {isReady ? 'أنا جاهز ✓ (اضغط للإلغاء)' : 'جاهز للعب!'}
            </button>
          </div>
        )}

        {/* ================= 2. GAMEPLAY PHASE ================= */}
        {phase === 'GAMEPLAY' && (
          <div className="flex-1 flex flex-col justify-between gap-3">
            {/* Turn Status Banner */}
            <div
              className={`w-full p-3 rounded-2xl border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] text-center transition-all ${
                isMyTurn
                  ? 'bg-[#8A9A5B] text-white font-black animate-none'
                  : 'bg-[#F7F4EC] text-[#2C2A29] font-bold'
              }`}
            >
              {isMyTurn ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-base">🎯 دورك الآن! اختر كرت ثم اضغط على موقع الحرف للتبديل</span>
                </div>
              ) : (
                <div className="text-xs text-[#5C4033]">
                  بانتظار دور: <span className="font-black text-[#2C2A29]">{players.find((p) => p.id === activePlayerId)?.name || 'اللاعب الآخر'}</span>...
                </div>
              )}
            </div>

            {/* Error Message Toast */}
            {errorMessage && (
              <div className="w-full bg-[#C68B59] text-white text-xs font-black p-2.5 rounded-xl border-2 border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29] flex items-center justify-center gap-2">
                <AlertCircle size={15} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Ground Word / Drop Targets */}
            <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] rounded-2xl p-3 shadow-[4px_4px_0px_#2C2A29]">
              <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-xs font-black text-[#5C4033]">الكلمة الحالية على الأرض:</span>
                <span className="text-[10px] font-bold text-[#8A9A5B] bg-[#E5E0D5] px-2 py-0.5 rounded-lg border border-[#2C2A29]">
                  {selectedCard ? `الحرف المختار: ${selectedCard.letter}` : 'اختر كرتك للتبديل'}
                </span>
              </div>

              {/* 3 Active Board Slots */}
              <div className="flex justify-center items-center gap-3 my-2">
                {board.map((slot, idx) => {
                  const pos = idx as 0 | 1 | 2;
                  const label = pos === 0 ? 'الحرف الأول' : pos === 1 ? 'الحرف الأوسط' : 'الحرف الأخير';

                  return (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <StackedBoardSlot
                        slot={slot}
                        size="md"
                        isTargetable={isMyTurn && !!selectedCardId}
                        onSlotClick={() => handlePlaceCardOnSlot(pos)}
                      />
                      {isMyTurn && selectedCardId && (
                        <button
                          onClick={() => handlePlaceCardOnSlot(pos)}
                          className="text-[10px] font-black bg-[#8A9A5B] text-white border border-[#2C2A29] shadow-[1px_1px_0px_#2C2A29] px-2 py-0.5 rounded-md hover:bg-[#2C2A29] cursor-pointer"
                        >
                          بدّل هنا
                        </button>
                      )}
                      {(!isMyTurn || !selectedCardId) && (
                        <span className="text-[9px] font-bold text-[#5C4033]">{label}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Result Preview Hint */}
              {selectedCard && (
                <div className="text-center text-xs font-bold text-[#5C4033] mt-2 pt-2 border-t border-[#2C2A29]/15">
                  اضغط على أي موقع بالأعلى لاستبداله بـ <span className="font-black text-[#8A9A5B] text-sm">({selectedCard.letter})</span>
                </div>
              )}
            </div>

            {/* Player's Cascading Hand */}
            <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] rounded-2xl p-3 shadow-[4px_4px_0px_#2C2A29]">
              <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-xs font-black text-[#2C2A29]">كروتك في اليد ({hand.length}):</span>
                <span className="text-[10px] font-bold text-[#5C4033]">اضغط على كرت لتحديده</span>
              </div>

              {/* Row 1 */}
              <div className="flex justify-center items-center -space-x-3 space-x-reverse py-1">
                {row1.map((card) => (
                  <div key={card.id} className="transition-transform duration-150">
                    <KalimCard
                      card={card}
                      size="sm"
                      isSelected={selectedCardId === card.id}
                      onClick={() => handleSelectCard(card.id)}
                    />
                  </div>
                ))}
              </div>

              {/* Row 2 (if any) */}
              {row2.length > 0 && (
                <div className="flex justify-center items-center -space-x-3 space-x-reverse py-1 mt-1">
                  {row2.map((card) => (
                    <div key={card.id} className="transition-transform duration-150">
                      <KalimCard
                        card={card}
                        size="sm"
                        isSelected={selectedCardId === card.id}
                        onClick={() => handleSelectCard(card.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Action Bar */}
            <div className="flex gap-2 items-center">
              <button
                disabled={!isMyTurn}
                onClick={handleDrawCard}
                className={`flex-1 py-3 px-4 rounded-xl font-black text-xs border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isMyTurn
                    ? 'bg-[#C68B59] text-white hover:bg-[#b07849] active:translate-y-0.5'
                    : 'bg-[#E5E0D5] text-[#2C2A29]/40 border-[#2C2A29]/40 shadow-none cursor-not-allowed'
                }`}
              >
                <Layers size={14} />
                <span>سحب كرت وتخطي الدور (+1 كرت)</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= 3. ROUND WIN / PODIUM PHASE ================= */}
        {(phase === 'ROUND_WIN' || phase === 'PODIUM') && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 my-auto">
            <div className="w-20 h-20 rounded-3xl bg-[#8A9A5B] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] flex items-center justify-center text-white">
              <Trophy size={40} />
            </div>

            <div>
              <span className="text-xs font-black text-[#5C4033] bg-[#F7F4EC] border border-[#2C2A29] px-3 py-1 rounded-xl">
                نهاية الجولة
              </span>
              <h2 className="text-2xl font-black text-[#2C2A29] mt-2">
                {winner?.id === playerId ? 'مبروك! أنت الفائز باللعبة!' : `الفائز: ${winner?.name || 'لاعب'}`}
              </h2>
              <p className="text-sm font-bold text-[#8A9A5B] mt-1">
                {winner?.id === playerId ? 'صفرت كل كروتك وحصلت على +15 pt' : 'تم تصفير الكروت بالكامل!'}
              </p>
            </div>

            <div className="w-full bg-[#F7F4EC] border-2 border-[#2C2A29] rounded-2xl p-4 shadow-[3px_3px_0px_#2C2A29]">
              <span className="text-xs font-bold text-[#5C4033] block mb-2">ترتيب الكروت المتبقية:</span>
              <div className="flex flex-col gap-2">
                {players
                  .slice()
                  .sort((a, b) => a.cardsCount - b.cardsCount)
                  .map((p, idx) => (
                    <div
                      key={p.id}
                      className={`flex justify-between items-center p-2 rounded-xl border-2 border-[#2C2A29] ${
                        p.cardsCount === 0
                          ? 'bg-[#8A9A5B] text-white shadow-[2px_2px_0px_#2C2A29]'
                          : 'bg-[#E5E0D5] text-[#2C2A29]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs">#{idx + 1}</span>
                        <span className="font-black text-sm">{p.name} {p.id === playerId ? '(أنت)' : ''}</span>
                      </div>
                      <span className="text-xs font-bold">
                        {p.cardsCount === 0 ? 'فائز (+15 pt)' : `${p.cardsCount} كروت`}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <button
              onClick={() => navigate(`/room/${roomCode}/lobby`)}
              className="w-full bg-[#C68B59] text-white py-3.5 rounded-2xl font-black text-base border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] hover:bg-[#2C2A29] cursor-pointer"
            >
              العودة للوبي الرئيسي
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
