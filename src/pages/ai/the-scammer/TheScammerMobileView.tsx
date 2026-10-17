// src/pages/ai/the-scammer/TheScammerMobileView.tsx
import React, { useState, useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  Gavel,
  Clock,
  Send,
  AlertTriangle,
  Trophy,
  Check,
  Crown
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { ScammerTopBar } from './components/ScammerTopBar';
import { MobileTopBar } from '../../../components/MobileTopBar';
import { clearPlayerSession } from '../../../utils/playerSession';
import { AnimatedBidCounter } from './components/AnimatedBidCounter';
import { UnifiedShabahLobby } from '../../../components/lobby/UnifiedShabahLobby';
import {
  ScammerPhase,
  WeirdProduct,
  ChatMessage
} from './types';
import { WEIRD_PRODUCTS_BANK } from './data/productsBank';

interface TheScammerMobileViewProps {
  roomCode: string;
  playerId: string;
  playerName: string;
  channel?: RealtimeChannel;
  onLeaveRoom?: () => void;
}

const getInitialBotMessage = (productName: string): ChatMessage => ({
  id: 'init_bot',
  sender: 'bot',
  text: `يا هلا بالبياع، عطني علوم هـ (${productName}) وش اللي يخليني أفتح بابه وأحط فيه كاش؟ اقنعني عشان أفتح السوم!`,
  currentBid: 0
});

export const TheScammerMobileView: React.FC<TheScammerMobileViewProps> = ({
  roomCode,
  playerId,
  playerName,
  onLeaveRoom
}) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef<boolean>(false);

  // Core Phase & Game State
  const [phase, setPhase] = useState<ScammerPhase>('LOBBY');
  const [currentProduct, setCurrentProduct] = useState<WeirdProduct>(WEIRD_PRODUCTS_BANK[0]);
  const currentProductRef = useRef<WeirdProduct>(WEIRD_PRODUCTS_BANK[0]);
  useEffect(() => { currentProductRef.current = currentProduct; }, [currentProduct]);

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isReady, setIsReady] = useState(false);

  // Negotiation & Chat State
  const [messages, setMessages] = useState<ChatMessage[]>(() => [getInitialBotMessage(WEIRD_PRODUCTS_BANK[0].name)]);
  const messagesRef = useRef<ChatMessage[]>(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const [inputText, setInputText] = useState('');
  const [currentBid, setCurrentBid] = useState(0);
  const currentBidRef = useRef(0);
  useEffect(() => { currentBidRef.current = currentBid; }, [currentBid]);

  const [isBotTyping, setIsBotTyping] = useState(false);
  const [botFinalRoast, setBotFinalRoast] = useState('');

  // Auto-scroll refs
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll down on new message or typing state without locking manual scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isBotTyping]);

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
      console.warn(`[Mobile Scammer] Error broadcasting ${event}:`, err);
    }
  };

  // Channel Lifecycle
  useEffect(() => {
    const normalizedCode = (roomCode || '').trim().toUpperCase();
    if (!normalizedCode) return;
    const channelName = `scammer:${normalizedCode}`;

    if (channelRef.current) {
      console.log(`[Mobile Scammer] Removing existing channel before initialization: ${channelName}`);
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log(`[Mobile Scammer] Initializing channel: ${channelName}`);
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
          alert('تم استبعادك من الحراج');
          if (onLeaveRoom) {
            onLeaveRoom();
          } else {
            window.location.href = '/';
          }
        }
      })
      .on('broadcast', { event: 'KICK_ALL_PLAYERS' }, () => {
        alert('تم إنهاء الحراج وإغلاق الغرفة من قِبل المضيف');
        if (onLeaveRoom) {
          onLeaveRoom();
        } else {
          window.location.href = '/';
        }
      })
      .on('broadcast', { event: 'GAME_TERMINATED' }, () => {
        alert('تم إنهاء الحراج وإغلاق الغرفة من قِبل المضيف');
        if (onLeaveRoom) {
          onLeaveRoom();
        } else {
          window.location.href = '/';
        }
      })
      .on('broadcast', { event: 'PLAYER_READY_LIST' }, ({ payload }) => {
        if (!payload) return;
        if (Array.isArray(payload.readyPlayerIds)) {
          setIsReady(payload.readyPlayerIds.includes(playerId));
        }
      })
      .on('broadcast', { event: 'SCAMMER_PHASE_CHANGE' }, ({ payload }) => {
        if (!payload) return;
        const newProduct = payload.product || currentProductRef.current;
        if (payload.product) {
          setCurrentProduct(payload.product);
          currentProductRef.current = payload.product;
        }
        if (payload.phase) {
          setPhase(payload.phase);
          if (payload.phase === 'PRODUCT_REVEAL') {
            const initMsg = getInitialBotMessage(newProduct.name);
            setMessages([initMsg]);
            messagesRef.current = [initMsg];
            setCurrentBid(0);
            currentBidRef.current = 0;
            setInputText('');
            setIsBotTyping(false);
            setBotFinalRoast('');
          } else if (payload.phase === 'LOBBY') {
            setIsReady(false);
            const initMsg = getInitialBotMessage(newProduct.name);
            setMessages([initMsg]);
            setCurrentBid(0);
          }
        }
        if (typeof payload.duration === 'number') {
          setTimeLeft(payload.duration);
        }
      })
      .on('broadcast', { event: 'RETURN_TO_LOBBY' }, () => {
        setPhase('LOBBY');
        setIsReady(false);
        const initMsg = getInitialBotMessage(currentProductRef.current.name);
        setMessages([initMsg]);
        setCurrentBid(0);
        currentBidRef.current = 0;
        setInputText('');
        setIsBotTyping(false);
      })
      .on('broadcast', { event: 'SCAMMER_ROOM_STATE_SYNC' }, ({ payload }) => {
        if (!payload) return;
        if (payload.phase) setPhase(payload.phase);
        if (payload.currentProduct) {
          setCurrentProduct(payload.currentProduct);
          currentProductRef.current = payload.currentProduct;
        }
        if (typeof payload.timeLeft === 'number') setTimeLeft(payload.timeLeft);
        if (Array.isArray(payload.readyPlayerIds)) {
          setIsReady(payload.readyPlayerIds.includes(playerId));
        }
      });

    // Subscribe ONCE
    channel.subscribe((status) => {
      console.log(`[Mobile Scammer Channel]: ${status}`);
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
      console.log(`[Mobile Scammer] Cleaning up channel: ${channelName}`);
      isSubscribedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomCode, playerId, playerName]);

  // Local ticker for smooth mobile countdown display
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Toggle ready status in LOBBY
  const handleToggleReady = () => {
    const nextState = !isReady;
    setIsReady(nextState);
    broadcastEvent('PLAYER_READY_TOGGLE', {
      playerId,
      isReady: nextState
    });
  };

  // Send player message & negotiate with AI buyer
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || isBotTyping || phase !== 'NEGOTIATION_CHAT' || timeLeft <= 0) return;

    setInputText('');

    const playerMsg: ChatMessage = {
      id: `p_${Date.now()}`,
      sender: 'player',
      text,
      currentBid: currentBidRef.current,
      timestamp: Date.now()
    };

    const updatedMessages = [...messagesRef.current, playerMsg];
    setMessages(updatedMessages);
    messagesRef.current = updatedMessages;
    setIsBotTyping(true);

    try {
      const chatHistory = updatedMessages.map((m) => ({
        role: m.sender === 'player' ? 'user' : 'model',
        text: m.text
      }));

      const response = await supabase.functions.invoke('scammer-chat', {
        body: {
          product: currentProductRef.current,
          chatHistory,
          newPlayerMessage: text,
          currentBid: currentBidRef.current
        }
      });

      if (response.error || !response.data) {
        throw response.error || new Error('No response from AI buyer');
      }

      const res = response.data;
      const newBidValue = typeof res.newBid === 'number' && res.newBid >= 0 ? res.newBid : currentBidRef.current;
      const botReplyText = res.botReply || 'كلامك ما يدخل العقل.. ماني زايدك!';

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: botReplyText,
        currentBid: newBidValue,
        timestamp: Date.now()
      };

      const finalMessages = [...updatedMessages, botMsg];
      setMessages(finalMessages);
      messagesRef.current = finalMessages;
      setCurrentBid(newBidValue);
      currentBidRef.current = newBidValue;
      setBotFinalRoast(botReplyText);

      // Broadcast bid update to TV Screen
      broadcastEvent('PLAYER_BID_UPDATE', {
        playerId,
        playerName,
        currentBid: newBidValue,
        messages: finalMessages,
        botFinalRoast: botReplyText
      });
    } catch (err) {
      console.warn('[AI Buyer Negotiation Error]:', err);
      const fallbackBid = currentBidRef.current;
      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: 'والله شكلك تبي تدرعم علي.. ماني زايدك ولا ريال إلا بعذر صاحي!',
        currentBid: fallbackBid,
        timestamp: Date.now()
      };
      const finalMessages = [...updatedMessages, botMsg];
      setMessages(finalMessages);
      messagesRef.current = finalMessages;

      broadcastEvent('PLAYER_BID_UPDATE', {
        playerId,
        playerName,
        currentBid: fallbackBid,
        messages: finalMessages,
        botFinalRoast: botMsg.text
      });
    } finally {
      setIsBotTyping(false);
    }
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

  const isTimeUp = timeLeft <= 0;

  // SPECIAL FULL-SCREEN LAYOUT FOR NEGOTIATION_CHAT (100dvh, Sticky Header, Free Scroll, Sticky Footer)
  if (phase === 'NEGOTIATION_CHAT') {
    return (
      <div className="h-[100dvh] w-full flex flex-col bg-warm-sand overflow-hidden font-sans select-none" dir="rtl">
        <MobileTopBar roomCode={roomCode} playerName={playerName} onLeaveRoom={handleLeaveRoom} />
        {/* 1. Sticky Posh Header */}
        <header className="p-3 bg-[#E5E0D5]/95 backdrop-blur-sm border-b-2 border-[#2C2A29] flex items-center justify-between z-20 flex-shrink-0">
          <div className="flex flex-col text-right">
            <span className="text-[10px] font-bold text-[#5C4033]">السلعة المعروضة:</span>
            <span className="text-xs font-black text-[#2C2A29] truncate max-w-[150px]">
              {currentProduct?.name || 'سلعة الحراج'}
            </span>
            <div className="flex items-center gap-1 text-[11px] font-black text-[#C68B59] mt-0.5">
              <Clock size={12} />
              <span>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Luxury Animated Bid Widget with Haptics */}
          <AnimatedBidCounter bid={currentBid} enableHaptics={true} />
        </header>

        {/* 2. Free-Scrolling Chat Container (Up and Down seamlessly) */}
        <main
          ref={chatScrollRef}
          className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3"
        >
          {messages.map((msg) => {
            const isPlayer = msg.sender === 'player';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isPlayer ? 'items-end' : 'items-start'} max-w-full`}
              >
                <span className="text-[10px] font-bold text-[#5C4033] mb-0.5 px-1">
                  {isPlayer ? 'أنت' : 'الزبون الشريطي'}
                </span>
                <div
                  className={`p-3.5 rounded-2xl border-2 text-sm font-bold leading-relaxed max-w-[85%] break-words ${
                    isPlayer
                      ? 'bg-[#8A9A5B]/15 border-[#8A9A5B] text-[#2C2A29] rounded-br-none shadow-[2px_2px_0px_#8A9A5B]'
                      : 'bg-[#F7F4EC] border-[#2C2A29] text-[#2C2A29] rounded-bl-none shadow-[3px_3px_0px_#2C2A29]'
                  }`}
                >
                  <p>{msg.text}</p>
                  {msg.sender === 'bot' && (
                    <div className="mt-1.5 pt-1 border-t border-[#2C2A29]/15 text-[10px] font-black text-[#8A9A5B]">
                      السومة المعتمدة: {msg.currentBid} ريال
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isBotTyping && (
            <div className="flex items-center gap-2 p-3 bg-[#F7F4EC] border-2 border-[#2C2A29] rounded-2xl rounded-bl-none w-fit shadow-[2px_2px_0px_#2C2A29]">
              <span className="text-xs font-bold text-[#5C4033]">الزبون يفحص كلامك ويفكر...</span>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-[#8A9A5B] rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-[#8A9A5B] rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-[#8A9A5B] rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          {/* Anchor for auto-scroll */}
          <div ref={messagesEndRef} className="h-1" />
        </main>

        {/* 3. Sticky Input Area */}
        <footer className="p-3 bg-[#E5E0D5] border-t-2 border-[#2C2A29] z-20 flex-shrink-0">
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2 max-w-md mx-auto"
          >
            <input
              type="text"
              maxLength={120}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isBotTyping || isTimeUp}
              placeholder={isTimeUp ? 'انتهى وقت المزاد!' : 'ارقع السالفة واقنع الزبون...'}
              className="flex-1 bg-white border-2 border-[#2C2A29] rounded-xl px-3 py-2.5 text-sm font-bold text-[#2C2A29] placeholder:text-[#5C4033]/50 focus:outline-none shadow-[2px_2px_0px_#2C2A29] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isBotTyping || isTimeUp}
              className="px-4 py-2.5 bg-[#8A9A5B] text-white border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl font-black text-sm hover:bg-[#2C2A29] active:translate-y-0.5 disabled:opacity-40 cursor-pointer"
            >
              <Send size={16} />
            </button>
          </form>
        </footer>
      </div>
    );
  }

  if (phase === 'LOBBY') {
    return (
      <UnifiedShabahLobby
        roomCode={roomCode}
        gameId="the-scammer"
        gameTitle="شبح الشريطي"
        players={[{ id: playerId, name: playerName, isReady }]}
        role="contestant"
        currentPlayerId={playerId}
        isReady={isReady}
        onToggleReady={handleToggleReady}
        onExit={handleLeaveRoom}
      />
    );
  }

  // STANDARD VIEW FOR LOBBY, PRODUCT_REVEAL, SHOWCASE, PODIUM
  return (
    <div className="min-h-screen bg-[#000000] flex flex-col font-sans select-none" dir="rtl">
      <MobileTopBar roomCode={roomCode} playerName={playerName} onLeaveRoom={handleLeaveRoom} />
      <ScammerTopBar
        roomCode={roomCode}
        phase={phase}
        onLeaveRoom={handleLeaveRoom}
        isHost={false}
      />

      <main className="flex-1 max-w-md w-full mx-auto p-4 flex flex-col justify-start">
        {/* PHASE 1: LOBBY */}
        {false && (
          <div className="flex-1 flex flex-col justify-center items-center gap-6 text-center py-6">
            <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl p-6 w-full">
              <div className="w-16 h-16 bg-[#8A9A5B]/20 border-2 border-[#2C2A29] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Gavel className="text-[#8A9A5B]" size={32} />
              </div>

              <h2 className="text-2xl font-black text-[#2C2A29] mb-1">النصاب</h2>
              <p className="text-xs text-[#5C4033] font-bold mb-4">
                بيع سلعة مستحيلة لزبون شكّاك.. وأعلى سومة تكسب!
              </p>

              <div className="bg-white border-2 border-[#2C2A29] rounded-xl p-3 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#5C4033] font-bold">اسمك بالحراج:</span>
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
                {isReady ? 'إلغاء الجاهزية' : 'أنا جاهز للسوم!'}
              </button>

              <p className="text-[11px] text-[#5C4033] font-bold mt-4">
                {isReady
                  ? 'في انتظار باقي المتسابقين أو انطلاق الحراج من الشاشة...'
                  : 'اضغط جاهز عندما تكون مستعداً للانطلاق!'}
              </p>
            </div>
          </div>
        )}

        {/* PHASE 2: PRODUCT_REVEAL */}
        {phase === 'PRODUCT_REVEAL' && (
          <div className="flex-1 flex flex-col justify-center items-center gap-4 text-center py-4">
            <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl p-6 w-full text-right flex flex-col gap-4">
              <div className="flex items-center justify-between border-b-2 border-[#2C2A29] pb-3">
                <span className="text-xs font-black bg-[#C68B59] text-white px-2.5 py-1 rounded-full">
                  سلعة الحراج
                </span>
                <span className="text-xs font-black text-[#C68B59] flex items-center gap-1">
                  <Clock size={14} />
                  <span>{timeLeft}s</span>
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-[#2C2A29] mb-2">{currentProduct.name}</h3>
                <p className="text-xs text-[#5C4033] font-bold leading-relaxed">
                  {currentProduct.description}
                </p>
              </div>

              <div className="bg-[#B85C5C]/15 border-2 border-[#B85C5C] rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle size={16} className="text-[#B85C5C] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-black text-[#B85C5C] block">العيب الفادح:</span>
                  <span className="text-xs font-black text-[#2C2A29]">{currentProduct.flaw}</span>
                </div>
              </div>

              <div className="bg-white border-2 border-[#2C2A29] rounded-xl p-3 text-center">
                <p className="text-xs font-black text-[#8A9A5B]">
                  فكّر في ترقيعة ذكية تبرر العيب.. المفاوضات تبدأ فوراً!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PHASE 4: SHOWCASE_TRANSCRIPT */}
        {phase === 'SHOWCASE_TRANSCRIPT' && (
          <div className="flex-1 flex flex-col justify-center items-center gap-4 text-center py-6">
            <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl p-6 w-full flex flex-col gap-4">
              <div className="w-16 h-16 bg-[#8A9A5B]/20 border-2 border-[#2C2A29] rounded-full flex items-center justify-center mx-auto">
                <Crown className="text-[#8A9A5B]" size={32} />
              </div>

              <h3 className="text-xl font-black text-[#2C2A29]">انتهى وقت الحراج!</h3>
              <p className="text-xs text-[#5C4033] font-bold">
                طالع شاشة التلفزيون لمشاهدة أعلى سومة وسجل محادثة الفائز بالكامل!
              </p>

              <div className="bg-white border-2 border-[#2C2A29] rounded-xl p-4 flex items-center justify-between text-xs">
                <span className="font-bold text-[#5C4033]">سومتك النهائية:</span>
                <span className="font-black text-[#8A9A5B] text-base">{currentBid} ريال</span>
              </div>
            </div>
          </div>
        )}

        {/* PHASE 5: PODIUM */}
        {phase === 'PODIUM' && (
          <div className="flex-1 flex flex-col justify-center items-center gap-4 text-center py-6">
            <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl p-6 w-full flex flex-col gap-4">
              <div className="w-16 h-16 bg-[#8A9A5B]/20 border-2 border-[#2C2A29] rounded-2xl flex items-center justify-center mx-auto">
                <Trophy className="text-[#8A9A5B]" size={32} />
              </div>

              <h2 className="text-2xl font-black text-[#2C2A29]">منصة تتويج الحراج</h2>
              <p className="text-xs text-[#5C4033] font-bold">
                سومتك المسجلة: {currentBid} ريال
              </p>
              <p className="text-xs text-[#8A9A5B] font-black">
                تابع شاشة العرض لمشاهدة الترتيب النهائي وبدء حراج جديد!
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
