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
  BrokerItem,
} from './types';
import {
  createInitialBrokerState,
  getPersistedBrokerState,
} from './brokerSync';
import { getRandomBrokerItem } from './brokerItemsBank';
import { formatPriceArabic, toArabicDigits } from './brokerUtils';
import { evaluateBrokerPitch } from '../../../services/brokerEngine';
import {
  Send,
  Sparkles,
  AlertTriangle,
  Coins,
  Crosshair,
  TrendingUp,
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
  const [currentBid, setCurrentBid] = useState(() => brokerState.currentItem.openingBid);
  const [bulletsRemaining, setBulletsRemaining] = useState(7);
  const [isBidFlashing, setIsBidFlashing] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSubmitting]);

  // Synchronize with host broadcasts
  useEffect(() => {
    const unsubSync = roomBus.on('BROKER_STATE_SYNC', (evt: any) => {
      const payload = evt?.data || evt;
      if (!payload) return;

      setBrokerState(payload);

      // If item changed (new round), reset local chat and bullets
      if (payload.currentItem && payload.currentItem.id !== brokerState.currentItem.id) {
        setMessages([
          {
            id: `welcome_${Date.now()}`,
            sender: 'broker',
            text: `حيّاك الله يا ${playerName}! معروض قدامك "${payload.currentItem.name}". فتحت السوم بـ ${payload.currentItem.openingBid} ريال.. ورني وش بتسوي!`,
            timestamp: Date.now(),
          },
        ]);
        setCurrentBid(payload.currentItem.openingBid);
        setBulletsRemaining(7);
      }
    });

    const unsubLobby = roomBus.on('RETURN_TO_LOBBY', () => {
      setBrokerState((prev) => ({ ...prev, phase: 'LOBBY' }));
    });

    return () => {
      unsubSync();
      unsubLobby();
    };
  }, [brokerState.currentItem.id, playerName]);

  // Welcome message when entering AUCTION for the first time
  useEffect(() => {
    if (brokerState.phase === 'AUCTION' && messages.length === 0) {
      setMessages([
        {
          id: `init_msg_${Date.now()}`,
          sender: 'broker',
          text: `أهلاً بك يا ${playerName}! واجهتي هي "${brokerState.currentItem.name}". عيبها واضح لكن إذا عندك لسان حلو بزيدك سومة.. اسكب كلامك!`,
          timestamp: Date.now(),
        },
      ]);
      setCurrentBid(brokerState.currentItem.openingBid);
      setBulletsRemaining(7);
    }
  }, [brokerState.phase, brokerState.currentItem, playerName, messages.length]);

  // Submit contestant pitch to Shuraiti
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || bulletsRemaining <= 0) return;

    const pitch = inputText.trim();
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

    const isFirstBid = messages.filter((m) => m.sender === 'contestant').length === 0;
    const newBullets = Math.max(0, bulletsRemaining - 1);
    setBulletsRemaining(newBullets);

    try {
      // 2. Evaluate with Broker Engine (Local Guardrails + Gemini Flash)
      const evaluation = await evaluateBrokerPitch({
        item: brokerState.currentItem,
        pitch,
        currentBid,
        isFirstBid,
        playerName,
      });

      // 3. Audio & Visual Feedback
      if (evaluation.soundFx === 'cash') {
        sound.playCash();
        setIsBidFlashing(true);
        setTimeout(() => setIsBidFlashing(false), 1200);
      } else {
        sound.playBuzz();
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
      sound.playBuzz();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartGame = () => {
    sound.playSuccess();
    const nextItem = getRandomBrokerItem();
    const nextState: BrokerRoomState = {
      ...brokerState,
      phase: 'AUCTION',
      roundNumber: 1,
      currentItem: nextItem,
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

  // Phase 3: Round Winner View (Waiting for next round)
  if (brokerState.phase === 'ROUND_WINNER') {
    const isMeWinner = brokerState.winnerId === playerId;

    return (
      <div
        dir="rtl"
        className="min-h-screen w-full bg-[#000000] text-[#FFFFFF] flex flex-col items-center justify-center p-6 select-none text-center"
      >
        <div className="w-28 h-28 mb-4">
          <ShabahGhost mood={isMeWinner ? 'happy' : 'judging'} className="w-full h-full" />
        </div>

        <div className="w-full max-w-sm shabah-border-wrap mb-4">
          <div className="shabah-border-inner">
            <div className="shabah-surface p-6">
              <h2 className="text-xl sm:text-2xl font-black text-[#0A0A0A] mb-2">
                {isMeWinner ? '🎉 كفو! أنت صيدة الجولة 🎉' : 'انتهى مزاد هذه السلعة!'}
              </h2>
              <p className="text-sm font-bold text-neutral-600 mb-4">
                الفائز: <span className="font-black text-[#0A0A0A]">{brokerState.winnerName}</span>
              </p>
              <div className="py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-black text-lg">
                أعلى سومة: {formatPriceArabic(brokerState.winningBid || 0)}
              </div>
            </div>
          </div>
        </div>

        {isPlayerHost ? (
          <div className="flex gap-2.5 mt-4 w-full max-w-sm">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                const nextItem = getRandomBrokerItem();
                const nextState: BrokerRoomState = {
                  ...brokerState,
                  phase: 'AUCTION',
                  roundNumber: brokerState.roundNumber + 1,
                  currentItem: nextItem,
                  winnerId: null,
                  winnerName: null,
                  winningBid: null,
                  winningQuote: null,
                };
                setBrokerState(nextState);
                roomBus.broadcastBrokerSync(roomCode, nextState);
              }}
              className="flex-1 py-3.5 rounded-xl bg-white text-[#0A0A0A] font-black text-sm hover:bg-neutral-100 cursor-pointer border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] active:scale-95 transition-transform"
            >
              السلعة التالية
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                roomBus.broadcastReturnToLobby(roomCode);
              }}
              className="px-4 py-3.5 rounded-xl bg-neutral-900 border-2 border-white/20 text-white font-black text-sm hover:bg-neutral-800 cursor-pointer active:scale-95 transition-transform"
            >
              العودة للوبي
            </button>
          </div>
        ) : (
          <p className="text-xs text-neutral-400 font-bold animate-pulse mt-2">
            في انتظار المضيف لبدء جولة وسلعة جديدة...
          </p>
        )}
      </div>
    );
  }

  // Phase 2: Live Private Auction Chat
  return (
    <div
      dir="rtl"
      className="min-h-screen min-h-[100dvh] w-full bg-[#000000] text-[#FFFFFF] flex flex-col justify-between selection:bg-white selection:text-black overflow-hidden"
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
              <span className="text-[10px] text-red-400 flex items-center gap-1 font-bold truncate">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                {brokerState.currentItem.fatalFlaw}
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
            <span>متبقي: {toArabicDigits(bulletsRemaining)}</span>
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

      {/* 2. Private Brutalist Chat Stream */}
      <main className="flex-1 w-full overflow-y-auto p-4 flex flex-col gap-3.5 max-w-2xl mx-auto">
        {messages.map((msg) => {
          const isContestant = msg.sender === 'contestant';

          if (isContestant) {
            return (
              <div key={msg.id} className="flex justify-end w-full">
                <div className="max-w-[82%] rounded-2xl bg-[#0A0A0A] text-white border-2 border-white/30 p-3.5 shadow-md">
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
                    <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      +{toArabicDigits(msg.bidIncrease)} ريال 💸
                    </span>
                  )}
                  {msg.bidIncrease === 0 && (
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                      مرفوض ❌
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
            <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-neutral-300">
              الشريطي يفكر ويحسب السومة...
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </main>

      {/* 3. Input & Send Box */}
      <footer className="w-full bg-[#000000] border-t-2 border-white/10 p-3 shrink-0 max-w-2xl mx-auto">
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
                  : 'أقنع الشريطي يرفع السومة...'
              }
              maxLength={140}
              disabled={isSubmitting || bulletsRemaining <= 0}
              className="flex-1 h-12 px-4 rounded-xl bg-neutral-900 border-2 border-white/20 text-white placeholder-neutral-500 text-sm font-bold focus:outline-none focus:border-white transition-colors disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isSubmitting || bulletsRemaining <= 0}
              className="h-12 px-5 rounded-xl font-black bg-white text-[#0A0A0A] hover:bg-neutral-100 active:scale-95 border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
            >
              <Send className="w-5 h-5 ml-1 -rotate-90" />
              <span>إرسال</span>
            </button>
          </div>

          {/* Character counter & bullet warning */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-neutral-500">
              {bulletsRemaining <= 0
                ? 'انتهت محاولاتك، انتظر إعلان الفائز على الشاشة'
                : 'أقوى كلام كوميدي أو مقنع يرفع السوم أكثر!'}
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
