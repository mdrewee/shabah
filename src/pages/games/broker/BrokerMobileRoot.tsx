import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useRoom, roomBus } from '../../../lib/roomBus';
import { useRoomSync } from '../../../hooks/useRoomSync';
import { sound } from '../../../lib/audio';
import { UnifiedShabahLobby } from '../../../components/lobby/UnifiedShabahLobby';
import { ShabahGhost } from '../../../components/mascot/ShabahGhost';
import {
  getOrCreatePlayerId,
  getOrCreatePlayerName,
  getPersistedPlayerName,
} from '../../../utils/playerSession';
import {
  BrokerRoomState,
  BrokerChatMessage,
} from './types';
import {
  createInitialBrokerState,
} from './brokerSync';
import { getBrokerItemByIndex } from '../../../data/brokerItems';
import { formatPriceArabic, toArabicDigits } from './brokerUtils';
import { evaluateBrokerPitch } from '../../../services/brokerEngine';
import { BrokerShowcaseStage } from './components/BrokerShowcaseStage';
import { BrokerRoundWinner } from './components/BrokerRoundWinner';
import { BrokerFinalPodium } from './components/BrokerFinalPodium';
import {
  Send,
  AlertTriangle,
  Coins,
  Crosshair,
  TrendingUp,
  XCircle,
  Sparkles,
} from 'lucide-react';

export const BrokerMobileRoot: React.FC = () => {
  const { code: rawCode } = useParams<{ code?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomCode = (rawCode || 'SHBH').trim().toUpperCase();
  const isPlayerHost = searchParams.get('host') === '1';

  const [playerId] = useState(() => getOrCreatePlayerId());
  const [playerName] = useState(() => getPersistedPlayerName() || getOrCreatePlayerName('متسابق'));

  // Maintain continuous presence across all Broker game phases
  useRoomSync({
    roomCode,
    role: 'contestant',
    playerId,
    playerName,
  });

  const [brokerState, setBrokerState] = useState<BrokerRoomState>(() =>
    createInitialBrokerState(roomCode)
  );

  // Private contestant chat state
  const [messages, setMessages] = useState<BrokerChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentBid, setCurrentBid] = useState(0); // Starts strictly at 0 SAR
  const [bulletsRemaining, setBulletsRemaining] = useState(7);
  const [isBidFlashing, setIsBidFlashing] = useState(false);
  const [isReadyForNext, setIsReadyForNext] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSubmitting]);

  const currentAuctionItem = brokerState.currentItem;
  const currentRoundNumber = brokerState.roundNumber;
  const lastActiveItemKeyRef = useRef<string>('');

  // 1. Dynamic item & round transition refresh
  useEffect(() => {
    if (!currentAuctionItem?.id) return;
    const itemKey = `${currentAuctionItem.id}-${currentRoundNumber}`;
    if (lastActiveItemKeyRef.current === itemKey) return;
    lastActiveItemKeyRef.current = itemKey;

    // Reset conversation completely and set the new item's greeting
    const initialGreeting =
      (currentAuctionItem as any).openingGreeting ||
      `أرحبو يا الربع! اليوم جايب لكم ${currentAuctionItem.name}.. قطبة ونظيفة، عطونا فتحة باب تسوى ولا تبخسون السلعة!`;

    setMessages([
      {
        id: `msg_initial_${itemKey}_${Date.now()}`,
        sender: 'broker',
        text: initialGreeting,
        timestamp: Date.now(),
      },
    ]);
    setCurrentBid(0);
    setBulletsRemaining(7);
    setIsReadyForNext(false);
  }, [currentAuctionItem?.id, currentAuctionItem?.name, currentAuctionItem?.flaw, currentRoundNumber]);

  // Synchronize with host broadcasts
  useEffect(() => {
    const unsubSync = roomBus.on('BROKER_STATE_SYNC', (evt: any) => {
      const payload = evt?.data || evt;
      if (!payload) return;
      setBrokerState(payload);
    });

    const unsubNewRound = roomBus.on('BROKER_NEW_ROUND', (evt: any) => {
      const payload = evt?.data || evt;
      if (payload?.state) {
        setBrokerState(payload.state);
      }
    });

    const unsubItemSync = roomBus.on('BROKER_ITEM_SYNC', (evt: any) => {
      const payload = evt?.data || evt;
      if (payload?.item) {
        setBrokerState((prev) => ({
          ...prev,
          currentItem: payload.item,
          roundNumber: payload.roundNumber || prev.roundNumber,
        }));
      }
    });

    const unsubGameStart = roomBus.on('GAME_STARTED', (evt: any) => {
      sound.playSuccess();
      setIsReadyForNext(false);
      const payload = evt?.data || evt;
      if (payload?.state) {
        setBrokerState(payload.state);
      } else {
        setBrokerState((prev) => ({ ...prev, phase: 'SHOWCASE' }));
      }
    });

    const unsubLobby = roomBus.on('RETURN_TO_LOBBY', () => {
      setBrokerState((prev) => ({ ...prev, phase: 'LOBBY' }));
      setIsReadyForNext(false);
      setCurrentBid(0);
      setMessages([]);
      lastActiveItemKeyRef.current = '';
    });

    return () => {
      unsubSync();
      unsubNewRound();
      unsubItemSync();
      unsubGameStart();
      unsubLobby();
    };
  }, []);

  // Submit contestant pitch to Shuraiti
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || bulletsRemaining <= 0) return;

    // Sanitize and enforce maximum character limit (DDoS / Buffer payload protection)
    const pitch = inputText.trim().slice(0, 200);
    if (!pitch) return;

    sound.playClick();

    // 1. Add contestant message to chat
    const contestantMsg: BrokerChatMessage = {
      id: `c_${Date.now()}`,
      sender: 'contestant',
      text: pitch,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, contestantMsg]);
    setInputText('');
    setIsSubmitting(true);

    const isFirstBid = messages.filter((m) => m.sender === 'contestant').length === 0 || currentBid === 0;
    const newBullets = Math.max(0, bulletsRemaining - 1);
    setBulletsRemaining(newBullets);

    try {
      // 2. Evaluate with Broker Engine (Local Guardrails + Opening Baseline + Gemini Flash)
      const evaluation = await evaluateBrokerPitch({
        item: brokerState.currentItem,
        pitch,
        currentBid,
        isFirstBid,
        playerName,
      });

      // 3. Audio & Visual Feedback
      if (evaluation.soundFx === 'cash') {
        sound.playCash?.();
        setIsBidFlashing(true);
        setTimeout(() => setIsBidFlashing(false), 1200);
      } else {
        sound.playBuzz?.();
      }

      const updatedBid = evaluation.newBid;
      setCurrentBid(updatedBid);

      // 4. Add Shuraiti response to chat
      const brokerMsg: BrokerChatMessage = {
        id: `b_${Date.now()}`,
        sender: 'broker',
        text: evaluation.reply,
        persuasionScore: evaluation.persuasionScore,
        bidIncrease: evaluation.bidIncrease,
        newBid: updatedBid,
        soundFx: evaluation.soundFx,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, brokerMsg]);

      // 5. Notify TV Host via roomBus (STRICT PRIVACY: DO NOT SEND CHAT TEXT, ONLY ANONYMOUS STATS)
      roomBus.broadcastBrokerBid(roomCode, {
        playerId,
        playerName,
        newBid: updatedBid,
        bidIncrease: evaluation.bidIncrease,
        quote: evaluation.persuasionScore >= 7 ? pitch : undefined,
        announcement: evaluation.publicAnnouncement,
        bulletsRemaining: newBullets,
      });
    } catch (err) {
      console.warn('[BrokerMobile] Pitch evaluation failed:', err);
      sound.playBuzz?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Contestant marks readiness for next round
  const handlePlayerReady = () => {
    const nextReady = !isReadyForNext;
    setIsReadyForNext(nextReady);
    roomBus.broadcastPlayerReadyUpdate(roomCode, playerId, nextReady, playerName);
  };

  // Host mobile starts game
  const handleStartGame = () => {
    sound.playSuccess();
    const firstItem = getBrokerItemByIndex(1);
    const nextState: BrokerRoomState = {
      ...brokerState,
      phase: 'SHOWCASE',
      roundNumber: 1,
      totalRounds: 5,
      currentItem: firstItem,
      winnerId: null,
      winnerName: null,
      winningBid: null,
      winningQuote: null,
    };
    setBrokerState(nextState);
    roomBus.broadcastBrokerSync(roomCode, nextState);
  };

  // Phase 1: Lobby View
  if (brokerState.phase === 'LOBBY') {
    return (
      <UnifiedShabahLobby
        roomCode={roomCode}
        gameId="ai-broker"
        gameTitle="الشبح الشريطي"
        role="contestant"
        isPlayerHost={isPlayerHost}
        currentPlayerId={playerId}
        onStartGame={handleStartGame}
        onExit={() => {
          roomBus.leavePlayer(roomCode, playerId);
          navigate('/');
        }}
      />
    );
  }

  // Phase 2: Host Pre-round Showcase View (Contestants enter chat & inspection instantly)
  if (brokerState.phase === 'SHOWCASE' && isPlayerHost) {
    return (
      <BrokerShowcaseStage
        item={brokerState.currentItem}
        roundNumber={brokerState.roundNumber}
        totalRounds={brokerState.totalRounds}
        durationSeconds={10}
        isHost={isPlayerHost}
        onComplete={() => {
          if (isPlayerHost) {
            const nextState: BrokerRoomState = {
              ...brokerState,
              phase: 'NEGOTIATION',
            };
            setBrokerState(nextState);
            roomBus.broadcastBrokerSync(roomCode, nextState);
          }
        }}
      />
    );
  }

  // Phase 4: Round Winner View
  if (brokerState.phase === 'ROUND_WINNER') {
    return (
      <BrokerRoundWinner
        item={brokerState.currentItem}
        roundNumber={brokerState.roundNumber}
        totalRounds={brokerState.totalRounds}
        winnerName={brokerState.winnerName || 'أحد المتسابقين'}
        winningBid={brokerState.winningBid || 0}
        winningQuote={brokerState.winningQuote || undefined}
        contestants={Object.values(brokerState.contestantBids)}
        currentUserId={playerId}
        isHost={isPlayerHost}
        onPlayerReady={handlePlayerReady}
        onNextRound={() => {
          if (isPlayerHost) {
            const nextRound = brokerState.roundNumber + 1;
            if (nextRound > brokerState.totalRounds) {
              const nextState: BrokerRoomState = {
                ...brokerState,
                phase: 'FINAL_PODIUM',
              };
              setBrokerState(nextState);
              roomBus.broadcastBrokerSync(roomCode, nextState);
            } else {
              const nextItem = getBrokerItemByIndex(nextRound);
              const nextState: BrokerRoomState = {
                ...brokerState,
                phase: 'SHOWCASE',
                roundNumber: nextRound,
                currentItem: nextItem,
              };
              setBrokerState(nextState);
              roomBus.broadcastBrokerSync(roomCode, nextState);
            }
          }
        }}
        onReturnToLobby={() => {
          if (isPlayerHost) {
            roomBus.broadcastReturnToLobby(roomCode);
          }
        }}
      />
    );
  }

  // Phase 5: Final 5-Round Podium View
  if (brokerState.phase === 'FINAL_PODIUM') {
    return (
      <BrokerFinalPodium
        contestants={Object.values(brokerState.contestantBids)}
        totalRounds={brokerState.totalRounds}
        isHost={isPlayerHost}
        onReturnToLobby={() => {
          if (isPlayerHost) {
            roomBus.broadcastReturnToLobby(roomCode);
          }
        }}
      />
    );
  }

  // Phase 3: Live Private Negotiation Chat (180s)
  return (
    <div
      key={`${roomCode}-${currentAuctionItem?.id || 'item'}-${currentRoundNumber}`}
      dir="rtl"
      className="min-h-screen min-h-[100dvh] w-full bg-[#000000] text-[#FFFFFF] flex flex-col justify-between selection:bg-white selection:text-black overflow-hidden font-sans"
    >
      {/* 1. Header & Top Data Bar */}
      <header className="w-full bg-[#000000] border-b-2 border-white/10 p-3 flex flex-col gap-2 shrink-0 select-none z-20">
        {/* Product Pill */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 shrink-0">
              <ShabahGhost mood="judging" className="w-full h-full" />
            </div>
            <div className="truncate">
              <span className="text-xs font-black text-white block truncate">
                {brokerState.currentItem.name}
              </span>
              <div className="flex items-center gap-2 text-[10px] truncate">
                <span className="text-red-400 flex items-center gap-1 font-bold truncate">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  {brokerState.currentItem.flaw}
                </span>
                {brokerState.currentItem.perk && (
                  <span className="text-emerald-400 flex items-center gap-1 font-bold truncate">
                    <Sparkles className="w-3 h-3 shrink-0" />
                    {brokerState.currentItem.perk}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bullets Badge */}
          <div
            className={`px-3 py-1 rounded-full border text-xs font-black flex items-center gap-1 shrink-0 ${
              bulletsRemaining <= 2
                ? 'bg-red-500/20 text-red-300 border-red-500 animate-pulse'
                : 'bg-white/10 text-white border-white/20'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>رصاصات: {toArabicDigits(bulletsRemaining)}</span>
          </div>
        </div>

        {/* Current Bid Display Card */}
        <div
          className={`w-full py-2 px-4 rounded-xl border-2 transition-all duration-300 flex items-center justify-between ${
            isBidFlashing
              ? 'bg-emerald-400 text-[#0A0A0A] border-white shadow-[0_0_20px_#4ADE80] scale-[1.02]'
              : 'bg-white text-[#0A0A0A] border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]'
          }`}
        >
          <span className="text-xs font-black text-neutral-600">سومتك الحالية للشريطي:</span>
          <div className="flex items-center gap-1.5">
            <Coins className="w-5 h-5 text-amber-500" />
            <span className="text-lg sm:text-xl font-black text-[#0A0A0A]">
              {formatPriceArabic(currentBid)}
            </span>
          </div>
        </div>
      </header>

      {/* 2. Private Brutalist Chat Stream (STRICT font-sans) */}
      <main className="flex-1 w-full overflow-y-auto p-4 flex flex-col gap-3.5 max-w-2xl mx-auto font-sans">
        {messages.map((msg) => {
          const isContestant = msg.sender === 'contestant';

          if (isContestant) {
            return (
              <div key={msg.id} className="flex justify-end w-full">
                <div className="max-w-[85%] rounded-2xl bg-[#0A0A0A] text-white border-2 border-white/30 p-3.5 shadow-md">
                  <p className="text-sm font-bold leading-relaxed">{msg.text}</p>
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className="flex justify-start items-start gap-2 w-full">
              <div className="w-8 h-8 shrink-0 rounded-full bg-white border-2 border-[#0A0A0A] flex items-center justify-center p-0.5 mt-1 shadow-sm">
                <ShabahGhost
                  mood={msg.soundFx === 'cash' ? 'happy' : 'angry'}
                  className="w-full h-full"
                />
              </div>

              <div className="max-w-[85%] rounded-2xl bg-white text-[#0A0A0A] border-2 border-[#0A0A0A] p-3.5 shadow-[3px_3px_0px_#0A0A0A]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-neutral-500">الشريطي:</span>
                  {msg.bidIncrease !== undefined && msg.bidIncrease > 0 && (
                    <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-700" />
                      +{toArabicDigits(msg.bidIncrease)} ريال
                    </span>
                  )}
                  {msg.bidIncrease === 0 && (
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-red-600" />
                      مرفوض
                    </span>
                  )}
                </div>

                <p className="text-sm font-bold leading-relaxed text-[#0A0A0A]">{msg.text}</p>
              </div>
            </div>
          );
        })}

        {isSubmitting && (
          <div className="flex justify-start items-center gap-2">
            <div className="w-7 h-7 shrink-0">
              <ShabahGhost mood="judging" className="w-full h-full animate-bounce" />
            </div>
            <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-neutral-300 font-sans">
              الشريطي يفكر ويحسب السومة...
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </main>

      {/* 3. Input & Send Box (STRICT font-sans) */}
      <footer className="w-full bg-[#000000] border-t-2 border-white/10 p-3 shrink-0 max-w-2xl mx-auto font-sans">
        <form onSubmit={handleSendMessage} className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                bulletsRemaining <= 0
                  ? 'نفدت رصاصاتك لهذه الجولة!'
                  : isSubmitting
                  ? 'الشريطي يرد عليك...'
                  : currentBid === 0
                  ? 'اكتب أول رسالة لافتتاح السوم...'
                  : 'أقنع الشريطي يرفع السومة...'
              }
              maxLength={140}
              disabled={isSubmitting || bulletsRemaining <= 0}
              className="flex-1 h-12 px-4 rounded-xl bg-neutral-900 border-2 border-white/20 text-white placeholder-neutral-500 text-sm font-bold focus:outline-none focus:border-white transition-colors disabled:opacity-50 font-sans"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isSubmitting || bulletsRemaining <= 0}
              className="h-12 px-5 rounded-xl font-black bg-white text-[#0A0A0A] hover:bg-neutral-100 active:scale-95 border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0 font-sans"
            >
              <Send className="w-5 h-5 ml-1 -rotate-90" />
              <span>إرسال</span>
            </button>
          </div>

          {/* Character counter & bullet guidance */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-neutral-500">
              {bulletsRemaining <= 0
                ? 'انتهت محاولاتك، ترقب الفائز بالجولة'
                : 'أقوى كلام كوميدي أو ذكي يرفع السوم أكثر!'}
            </span>

            <span className="text-[11px] font-mono text-neutral-400">
              {toArabicDigits(inputText.length)} / {toArabicDigits(140)}
            </span>
          </div>
        </form>
      </footer>
    </div>
  );
};
