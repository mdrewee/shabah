import { isRoomHost } from '../../../services/roomService';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  savePersistedBrokerState,
} from './brokerSync';
import { getBrokerItemByIndex, ensureBrokerItem } from '../../../data/brokerItems';
import { formatPriceArabic, toArabicDigits } from './brokerUtils';
import { formatSecondsToTime } from '../../../utils/numberFormat';
import { requestBrokerPitch } from '../../../services/brokerPitchRequest';
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
  const navigate = useNavigate();
  const roomCode = (rawCode || 'SHBH').trim().toUpperCase();
  const isPlayerHost = isRoomHost(roomCode);

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

  const chatRequest = useRef(0);
  const brokerStateRef = useRef(brokerState);
  brokerStateRef.current = brokerState;

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

  const currentAuctionItem = ensureBrokerItem(brokerState.currentItem, brokerState.roundNumber);
  const currentRoundNumber = brokerState.roundNumber;
  const lastActiveItemKeyRef = useRef<string>('');

  // 1. Dynamic item & round transition refresh
  useEffect(() => {
    if (!currentAuctionItem?.id) return;
    const itemKey = `${brokerState.gameStartedAt || 0}-${currentAuctionItem.id}-${currentRoundNumber}`;
    if (lastActiveItemKeyRef.current === itemKey) return;
    lastActiveItemKeyRef.current = itemKey;

    ++chatRequest.current;
    setIsSubmitting(false);
    // Reset conversation completely and set the new item's greeting
    const initialGreeting =
      (currentAuctionItem as any).openingGreeting ||
      `أرحبو يا الربع! اليوم جايب لكم ${currentAuctionItem.name}.. قطبة ونظيفة، عطونا فتحة باب تسوى ولا تبخسون السلعة!`;

    let restoredMessages: BrokerChatMessage[] | null = null;
    try { restoredMessages = JSON.parse(sessionStorage.getItem(`broker_chat_${roomCode}_${playerId}_${itemKey}`) || 'null'); } catch {}
    setMessages(restoredMessages || [
      {
        id: `msg_initial_${itemKey}_${Date.now()}`,
        sender: 'broker',
        text: initialGreeting,
        timestamp: Date.now(),
      },
    ]);
    setCurrentBid(brokerState.contestantBids[playerId]?.currentBid || 0);
    setBulletsRemaining(brokerState.contestantBids[playerId]?.bulletsRemaining ?? 7);
    setIsReadyForNext(false);
  }, [currentAuctionItem?.id, currentAuctionItem?.name, currentAuctionItem?.flaw, currentRoundNumber, brokerState.gameStartedAt]);

  useEffect(() => {
    if (!messages.length || !lastActiveItemKeyRef.current) return;
    try { sessionStorage.setItem(`broker_chat_${roomCode}_${playerId}_${lastActiveItemKeyRef.current}`, JSON.stringify(messages)); } catch {}
  }, [messages, roomCode, playerId]);

  useEffect(() => {
    const bid = brokerState.contestantBids[playerId];
    if (!bid || isSubmitting) return;
    setCurrentBid(bid.currentBid);
    setBulletsRemaining(bid.bulletsRemaining);
    setIsReadyForNext(Boolean(bid.isReadyForNextRound));
  }, [brokerState.contestantBids, playerId, isSubmitting]);

  // Synchronize with host broadcasts
  useEffect(() => {
    const unsubSync = roomBus.on('BROKER_STATE_SYNC', (evt: any) => {
      const payload = evt?.data || evt;
      if (!payload) return;
      if (payload.currentItem) {
        payload.currentItem = ensureBrokerItem(payload.currentItem, payload.roundNumber);
      }
      setBrokerState(payload);
      savePersistedBrokerState(roomCode, payload);
    }, roomCode);

    const unsubNewRound = roomBus.on('BROKER_NEW_ROUND', (evt: any) => {
      const payload = evt?.data || evt;
      if (payload?.state) {
        if (payload.state.currentItem) {
          payload.state.currentItem = ensureBrokerItem(payload.state.currentItem, payload.state.roundNumber);
        }
        setBrokerState(payload.state);
        savePersistedBrokerState(roomCode, payload.state);
      }
    });

    const unsubItemSync = roomBus.on('BROKER_ITEM_SYNC', (evt: any) => {
      const payload = evt?.data || evt;
      if (payload?.item) {
        const safe = ensureBrokerItem(payload.item, payload.roundNumber);
        setBrokerState((prev) => {
          const next = {
            ...prev,
            currentItem: safe,
            roundNumber: payload.roundNumber || prev.roundNumber,
          };
          savePersistedBrokerState(roomCode, next);
          return next;
        });
      }
    });

    const unsubGameStart = roomBus.on('GAME_STARTED', (evt: any) => {
      sound.playSuccess();
      setIsReadyForNext(false);
      const payload = evt?.data || evt;
      if (payload?.state) {
        if (payload.state.currentItem) {
          payload.state.currentItem = ensureBrokerItem(payload.state.currentItem, payload.state.roundNumber);
        }
        setBrokerState(payload.state);
        savePersistedBrokerState(roomCode, payload.state);
      } else {
        setBrokerState((prev) => {
          const next: BrokerRoomState = { ...prev, phase: 'SHOWCASE' };
          savePersistedBrokerState(roomCode, next);
          return next;
        });
      }
    });

    const unsubLobby = roomBus.on('RETURN_TO_LOBBY', () => {
      ++chatRequest.current;
      setIsSubmitting(false);
      setBrokerState((prev) => {
        const next: BrokerRoomState = { ...prev, phase: 'LOBBY' };
        savePersistedBrokerState(roomCode, next);
        return next;
      });
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
  }, [roomCode]);

  useEffect(() => {
    roomBus.emit('REQUEST_ROOM_STATE', roomCode, {});
  }, [roomCode]);

  // Submit contestant pitch to Shuraiti
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || bulletsRemaining <= 0 || brokerState.phase !== 'NEGOTIATION' || Date.now() >= (brokerState.roundEndsAt || 0)) return;

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
    const request = ++chatRequest.current;

    const isFirstBid = messages.filter((m) => m.sender === 'contestant').length === 0 || currentBid === 0;
    const newBullets = Math.max(0, bulletsRemaining - 1);
    setBulletsRemaining(newBullets);

    try {
      // 2. Evaluate with Broker Engine (Local Guardrails + Opening Baseline + Gemini Flash)
      const evaluation = await requestBrokerPitch(roomCode, playerId, currentRoundNumber, currentAuctionItem.id, pitch);

      if (request !== chatRequest.current || brokerStateRef.current.phase !== 'NEGOTIATION') return;

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

    } catch (err) {
      if (request !== chatRequest.current) return;
      setBulletsRemaining(brokerStateRef.current.contestantBids[playerId]?.bulletsRemaining ?? 7);
      setInputText(pitch);
      setMessages((previous) => [...previous, { id: 'error_' + Date.now(), sender: 'broker', text: 'تعذر الاتصال. محاولتك محفوظة، اضغط إرسال لإعادة المحاولة.', timestamp: Date.now() }]);
      console.warn('[BrokerMobile] Pitch evaluation failed:', err);
      sound.playBuzz?.();
    } finally {
      if (request === chatRequest.current) setIsSubmitting(false);
    }
  };

  // Contestant marks readiness for next round
  const handlePlayerReady = () => {
    const nextReady = !isReadyForNext;
    setIsReadyForNext(nextReady);
    roomBus.broadcastPlayerReadyUpdate(roomCode, playerId, nextReady, playerName);
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
        onExit={() => {
          roomBus.leavePlayer(roomCode, playerId);
          navigate('/');
        }}
      />
    );
  }

  // Phase 2: Pre-round Showcase View (10s item inspection before negotiation starts)
  if (brokerState.phase === 'SHOWCASE') {
    return (
      <BrokerShowcaseStage
        item={currentAuctionItem}
        roundNumber={brokerState.roundNumber}
        totalRounds={brokerState.totalRounds}
        durationSeconds={10}
        isHost={isPlayerHost}
        onComplete={() => {
          if (isPlayerHost) roomBus.emit('BROKER_ITEM_SYNC', roomCode, { action:'startNegotiation' });
        }}
      />
    );
  }

  // Phase 4: Round Winner View
  if (brokerState.phase === 'ROUND_WINNER') {
    return (
      <BrokerRoundWinner
        item={currentAuctionItem}
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
          if (isPlayerHost) roomBus.emit('BROKER_ITEM_SYNC', roomCode, { action:'advanceRound' });
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
      className="h-full min-h-0 w-full bg-[#000000] text-[#FFFFFF] flex flex-col justify-between selection:bg-white selection:text-black overflow-hidden font-sans"
    >
      {/* 1. Header & Top Data Bar */}
      <header className="w-full bg-[#000000] border-b-2 border-white/10 p-3 flex flex-col gap-2 shrink-0 select-none z-20">
        <div className="flex items-center justify-between text-sm font-bold text-zinc-300">
          <span>الجولة {toArabicDigits(brokerState.roundNumber)} من {toArabicDigits(brokerState.totalRounds)}</span>
          <span role="timer" dir="ltr" className={brokerState.timerSeconds <= 15 ? 'text-red-300' : 'text-emerald-300'}>{formatSecondsToTime(brokerState.timerSeconds)}</span>
        </div>
        {/* Product Pill */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 shrink-0">
              <ShabahGhost mood="judging" className="w-full h-full" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-black text-white block truncate">
                {currentAuctionItem.name}
              </span>
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

        <details className="rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-sm leading-7">
          <summary className="cursor-pointer font-bold text-zinc-200">تفاصيل السلعة وعيوبها</summary>
          <p className="mt-2 flex items-start gap-2 text-red-300"><AlertTriangle className="mt-1 h-4 w-4 shrink-0" />{currentAuctionItem.flaw}</p>
          {currentAuctionItem.perk && <p className="flex items-start gap-2 text-emerald-300"><Sparkles className="mt-1 h-4 w-4 shrink-0" />{currentAuctionItem.perk}</p>}
        </details>
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
      <main className="min-h-0 flex-1 w-full overflow-y-auto p-4 flex flex-col gap-3.5 max-w-2xl mx-auto font-sans">
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
