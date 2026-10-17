import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Play, ArrowRight, UserCheck, Clock, Award, Shuffle, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { KalimTopBar } from './components/KalimTopBar';
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
import { sound } from '../../../lib/audio';

export const KalimTVView: React.FC = () => {
  const { code: rawCode } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const roomCode = (rawCode || '000000').toUpperCase();

  // State
  const [phase, setPhase] = useState<KalimPhase>('LOBBY');
  const [players, setPlayers] = useState<KalimPlayer[]>([]);
  const [board, setBoard] = useState<[BoardSlot, BoardSlot, BoardSlot]>(() => generateStarterBoard());
  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);
  const [turnTimeLeft, setTurnTimeLeft] = useState<number>(20);
  const [lastNotification, setLastNotification] = useState<TurnNotification | null>(null);
  const [winner, setWinner] = useState<KalimPlayer | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});

  // Countdown & Timer
  const [lobbyStartCountdown, setLobbyStartCountdown] = useState<number | null>(null);

  // Realtime Channel Ref Singleton
  const channelRef = useRef<RealtimeChannel | null>(null);
  const boardRef = useRef(board);
  const playersRef = useRef(players);
  const activeIndexRef = useRef(activePlayerIndex);

  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { activeIndexRef.current = activePlayerIndex; }, [activePlayerIndex]);

  // Broadcast Full State Helper
  const broadcastSync = useCallback((
    targetPhase: KalimPhase,
    targetBoard: [BoardSlot, BoardSlot, BoardSlot],
    targetPlayers: KalimPlayer[],
    targetActiveIndex: number,
    notification?: TurnNotification | null
  ) => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'KALIM_STATE_SYNC',
      payload: {
        phase: targetPhase,
        board: targetBoard,
        players: targetPlayers,
        activePlayerId: targetPlayers[targetActiveIndex]?.id || null,
        activePlayerIndex: targetActiveIndex,
        notification: notification || null
      }
    });
  }, []);

  // 1. Setup Supabase Realtime Channel
  useEffect(() => {
    const normalizedCode = roomCode.trim().toUpperCase();
    if (!normalizedCode) return;

    const channel = supabase.channel(`kalim:${normalizedCode}`, {
      config: { broadcast: { self: true }, presence: { key: 'tv_screen' } }
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

        // Deduplicate players
        const uniqueMap = new Map<string, KalimPlayer>();
        active.forEach((p) => {
          const existing = playersRef.current.find((pl) => pl.id === p.id);
          uniqueMap.set(p.id, {
            ...p,
            cardsCount: existing ? existing.cardsCount : 7
          });
        });
        const updatedList = Array.from(uniqueMap.values());
        setPlayers(updatedList);
      })
      .on('broadcast', { event: 'PLAYER_READY_TOGGLE' }, ({ payload }) => {
        const { playerId, isReady } = payload;
        setPlayers((prev) =>
          prev.map((p) => (p.id === playerId ? { ...p, isReady } : p))
        );
      })
      .on('broadcast', { event: 'PLAY_CARD_MOVE' }, ({ payload }) => {
        handlePlayerMove(payload);
      })
      .on('broadcast', { event: 'DRAW_PENALTY_CARD' }, ({ payload }) => {
        handlePlayerDraw(payload?.playerId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomCode]);

  // Handle Player Move
  const handlePlayerMove = (payload: { playerId: string; slotIndex: 0 | 1 | 2; card: LetterCard }) => {
    const { playerId, slotIndex, card } = payload;
    const currentActive = playersRef.current[activeIndexRef.current];

    if (!currentActive || currentActive.id !== playerId) return;

    const validation = validateKalimPlacement(boardRef.current, slotIndex, card.letter);
    if (!validation.isValid) return;

    sound.playCorrect();

    // 1. Update Board Stack
    const oldSlot = boardRef.current[slotIndex];
    const newSlot: BoardSlot = {
      positionIndex: slotIndex,
      topCard: card,
      stackHistory: [...oldSlot.stackHistory, oldSlot.topCard]
    };

    const newBoard: [BoardSlot, BoardSlot, BoardSlot] = [...boardRef.current] as [BoardSlot, BoardSlot, BoardSlot];
    newBoard[slotIndex] = newSlot;
    setBoard(newBoard);

    // 2. Decrement Player Card Count
    const updatedPlayers = playersRef.current.map((p) => {
      if (p.id === playerId) {
        return { ...p, cardsCount: Math.max(0, p.cardsCount - 1) };
      }
      return p;
    });

    const playerAfterMove = updatedPlayers.find((p) => p.id === playerId);

    // 3. Notification
    const notif: TurnNotification = {
      playerId,
      playerName: currentActive.name,
      prevLetter: oldSlot.topCard.letter,
      newLetter: card.letter,
      resultingWord: validation.resultingWord,
      type: 'MOVE',
      timestamp: Date.now()
    };
    setLastNotification(notif);

    // 4. Check Victory Condition (0 cards)
    if (playerAfterMove && playerAfterMove.cardsCount === 0) {
      sound.playVictory();
      setWinner(playerAfterMove);
      setScores((prev) => ({
        ...prev,
        [playerAfterMove.id]: (prev[playerAfterMove.id] || 0) + 15
      }));
      setPhase('ROUND_WIN');
      setPlayers(updatedPlayers);
      broadcastSync('ROUND_WIN', newBoard, updatedPlayers, activeIndexRef.current, notif);
      return;
    }

    // 5. Advance Turn Clockwise
    const nextIndex = (activeIndexRef.current + 1) % updatedPlayers.length;
    setActivePlayerIndex(nextIndex);
    setPlayers(updatedPlayers);
    setTurnTimeLeft(20);

    broadcastSync('GAMEPLAY', newBoard, updatedPlayers, nextIndex, notif);
  };

  // Handle Player Draw / Pass
  const handlePlayerDraw = (playerId: string) => {
    const currentActive = playersRef.current[activeIndexRef.current];
    if (!currentActive || currentActive.id !== playerId) return;

    sound.playClick();

    // Add 1 card to player
    const updatedPlayers = playersRef.current.map((p) => {
      if (p.id === playerId) {
        return { ...p, cardsCount: p.cardsCount + 1 };
      }
      return p;
    });

    const notif: TurnNotification = {
      playerId,
      playerName: currentActive.name,
      type: 'DRAW',
      timestamp: Date.now()
    };
    setLastNotification(notif);

    const nextIndex = (activeIndexRef.current + 1) % updatedPlayers.length;
    setActivePlayerIndex(nextIndex);
    setPlayers(updatedPlayers);
    setTurnTimeLeft(20);

    broadcastSync('GAMEPLAY', boardRef.current, updatedPlayers, nextIndex, notif);
  };

  // 2. Lobby Auto-Start Countdown (>= 2 ready players)
  const readyCount = useMemo(() => players.filter((p) => p.isReady).length, [players]);

  useEffect(() => {
    if (phase !== 'LOBBY') {
      setLobbyStartCountdown(null);
      return;
    }

    if (players.length >= 2 && readyCount >= 2) {
      if (lobbyStartCountdown === null) {
        setLobbyStartCountdown(3);
      }
    } else {
      setLobbyStartCountdown(null);
    }
  }, [players.length, readyCount, phase, lobbyStartCountdown]);

  useEffect(() => {
    if (phase !== 'LOBBY' || lobbyStartCountdown === null) return;

    if (lobbyStartCountdown <= 0) {
      startMatch();
      return;
    }

    const timer = setTimeout(() => {
      setLobbyStartCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [lobbyStartCountdown, phase]);

  // Start Match Handler
  const startMatch = () => {
    if (players.length < 2) return;
    sound.playClick();

    const starterBoard = generateStarterBoard();
    const initializedPlayers = players.map((p) => ({
      ...p,
      cardsCount: 7
    }));

    setBoard(starterBoard);
    setPlayers(initializedPlayers);
    setActivePlayerIndex(0);
    setTurnTimeLeft(20);
    setWinner(null);
    setLastNotification(null);
    setPhase('GAMEPLAY');

    // Inform all mobile clients of initial hands and game start
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'GAME_STARTED',
        payload: {
          board: starterBoard,
          players: initializedPlayers,
          activePlayerId: initializedPlayers[0].id
        }
      });
      broadcastSync('GAMEPLAY', starterBoard, initializedPlayers, 0, null);
    }
  };

  // 3. Gameplay Turn 20s Timer
  useEffect(() => {
    if (phase !== 'GAMEPLAY') return;

    const timer = setInterval(() => {
      setTurnTimeLeft((prev) => {
        if (prev <= 1) {
          // Time expired -> auto draw & pass turn
          const activeP = playersRef.current[activeIndexRef.current];
          if (activeP) {
            handlePlayerDraw(activeP.id);
          }
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  // Host Kick Player
  const handleKickPlayer = (playerId: string) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'KICK_PLAYER',
        payload: { playerId }
      });
    }
    setPlayers((prev) => prev.filter((p) => p.id !== playerId));
  };

  // Host Terminate Session
  const handleTerminateSession = () => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'GAME_TERMINATED',
        payload: {}
      });
    }
    navigate('/');
  };

  const currentWord = board.map((s) => s.topCard.letter).join(' - ');
  const currentWordConnected = board.map((s) => s.topCard.letter).join('');
  const activePlayer = players[activePlayerIndex];

  const joinUrl = `${window.location.origin}/join/${roomCode}`;

  return (
    <div className="w-full min-h-screen bg-[#E5E0D5] text-[#2C2A29] flex flex-col font-sans relative overflow-hidden select-none"
         style={{ backgroundImage: 'radial-gradient(rgba(44, 42, 41, 0.03) 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
      
      {/* Top Bar Header */}
      <KalimTopBar
        roomCode={roomCode}
        phase={phase}
        onTerminateSession={handleTerminateSession}
        onReturnToLobby={() => {
          setPhase('LOBBY');
          broadcastSync('LOBBY', board, players, 0);
        }}
      />

      {/* Main Table Content */}
      <div className="flex-1 flex flex-col items-center justify-between p-6 max-w-6xl mx-auto w-full">
        
        {/* PHASE 1: LOBBY */}
        {phase === 'LOBBY' && (
          <div className="w-full flex flex-col items-center gap-8 my-auto">
            <div className="text-center space-y-2">
              <h1 className="text-4xl md:text-5xl font-black text-[#2C2A29]">كَلِم</h1>
              <p className="text-base text-[#2C2A29]/70 font-semibold max-w-xl">
                كلمة ثلاثية في الأرض ومعك 7 كروت.. بدّل حرف وكوّن كلمة جديدة من المعجم، وأول من يصفّر كروته يفوز!
              </p>
            </div>

            {/* QR Code & Rules Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
              {/* QR Box */}
              <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl p-6 flex flex-col items-center justify-center gap-4 text-center">
                <div className="bg-white p-3 rounded-xl border-2 border-[#2C2A29] shadow-inner">
                  <QRCodeSVG value={joinUrl} size={140} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#2C2A29]/60">امسح الكود بكاميرا الجوال</div>
                  <div className="font-mono font-black text-2xl tracking-widest text-[#2C2A29]">{roomCode}</div>
                </div>
              </div>

              {/* Guide Card */}
              <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl p-6 flex flex-col justify-between text-right">
                <div>
                  <h3 className="font-black text-lg text-[#2C2A29] border-b-2 border-[#2C2A29] pb-2 mb-3">
                    طريقة لعب كَلِم
                  </h3>
                  <ul className="space-y-2 text-sm font-bold text-[#2C2A29]/80 leading-relaxed">
                    <li>• كلمة ثلاثية في الأرض وكل لاعب معه 7 كروت حروف.</li>
                    <li>• في دورك، بدّل حرف واحد من الأرض بحرف من يدك لتكوين كلمة مقبولة.</li>
                    <li>• المعجم يفحص الكلمة فوراً.. إذا الكلمة صحيحة ينزل كرتك.</li>
                    <li>• إذا انحشرت وما عندك كلمة، اسحب كرت وتخطى دورك.</li>
                    <li>• أول لاعب يخلّص كروته الـ 7 يفوز بالجولة (+15 pt).</li>
                  </ul>
                </div>

                <div className="mt-4 pt-3 border-t-2 border-[#2C2A29]/10 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2C2A29]/70">
                    اللاعبون الجاهزون: {readyCount} / {players.length}
                  </span>
                  {lobbyStartCountdown !== null ? (
                    <span className="bg-[#C68B59] text-white px-3 py-1 rounded-xl text-xs font-black">
                      ينطلق التحدي خلال {lobbyStartCountdown}s
                    </span>
                  ) : (
                    <span className="text-xs font-extrabold text-[#8A9A5B]">
                      (يتطلب لاعبين جاهزين على الأقل)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Connected Players Grid */}
            <div className="w-full max-w-4xl space-y-3">
              <div className="flex items-center justify-between px-2">
                <span className="font-black text-lg text-[#2C2A29]">المتسابقون ({players.length})</span>
                {players.length >= 2 && (
                  <button
                    onClick={startMatch}
                    className="flex items-center gap-2 bg-[#8A9A5B] hover:bg-[#2C2A29] text-white px-6 py-2 rounded-xl font-black text-sm border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] transition-transform active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>ابدأ اللعبة فوراً</span>
                  </button>
                )}
              </div>

              {players.length === 0 ? (
                <div className="bg-[#F7F4EC] border-2 border-dashed border-[#2C2A29]/40 rounded-2xl p-8 text-center text-[#2C2A29]/50 font-bold">
                  في انتظار انضمام اللاعبين من الجوال...
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl p-3 flex items-center justify-between relative group"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className={`w-3 h-3 rounded-full border border-[#2C2A29] ${player.isReady ? 'bg-[#8A9A5B]' : 'bg-[#C68B59]'}`} />
                        <span className="font-extrabold text-sm text-[#2C2A29] truncate">{player.name}</span>
                      </div>
                      <button
                        onClick={() => handleKickPlayer(player.id)}
                        className="opacity-0 group-hover:opacity-100 text-[#C68B59] hover:bg-[#C68B59]/10 p-1 rounded font-bold text-xs transition-opacity cursor-pointer"
                        title="طرد اللاعب"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PHASE 2: GAMEPLAY */}
        {phase === 'GAMEPLAY' && (
          <div className="w-full flex-1 flex flex-col justify-between items-center gap-6 my-auto">
            
            {/* Top Notification Banner */}
            {lastNotification && (
              <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] px-6 py-2 rounded-2xl text-center text-sm font-black flex items-center gap-3">
                {lastNotification.type === 'MOVE' ? (
                  <>
                    <span className="text-[#8A9A5B] font-extrabold">{lastNotification.playerName}</span>
                    <span>بدّل ({lastNotification.prevLetter}) بـ ({lastNotification.newLetter})</span>
                    <span className="bg-[#8A9A5B] text-white px-3 py-0.5 rounded-lg border border-[#2C2A29] font-mono">
                      {lastNotification.resultingWord} ✓
                    </span>
                  </>
                ) : (
                  <span className="text-[#C68B59] font-extrabold">
                    {lastNotification.playerName} سحب كرت وتخطى دوره
                  </span>
                )}
              </div>
            )}

            {/* CENTER STAGE: Master Board Slots with Physical 3D Layers */}
            <div className="flex flex-col items-center gap-6 my-auto">
              <div className="flex items-center justify-center gap-6 sm:gap-10">
                <StackedBoardSlot slot={board[0]} size="xl" slotLabel="الحرف الأول" />
                <StackedBoardSlot slot={board[1]} size="xl" slotLabel="الحرف الثاني" />
                <StackedBoardSlot slot={board[2]} size="xl" slotLabel="الحرف الثالث" />
              </div>

              {/* Word Badge & Turn Timer */}
              <div className="flex flex-col items-center gap-3">
                <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] px-8 py-2 rounded-2xl flex items-center gap-3">
                  <span className="text-xs font-bold text-[#5C4033]">الكلمة الحالية:</span>
                  <span className="text-3xl font-black text-[#2C2A29] font-mono tracking-widest">
                    {currentWord}
                  </span>
                  <span className="bg-[#8A9A5B]/20 text-[#8A9A5B] font-black text-xs px-2.5 py-1 rounded-lg border border-[#8A9A5B]">
                    {currentWordConnected}
                  </span>
                </div>

                {/* 20-Second Active Turn Timer */}
                <div className="w-80 bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl p-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-[#2C2A29]">
                    <Clock className="w-4 h-4 text-[#C68B59]" />
                    <span>مهلة دور {activePlayer?.name}:</span>
                  </div>
                  <span className={`font-mono font-black text-lg ${turnTimeLeft <= 5 ? 'text-[#C68B59]' : 'text-[#8A9A5B]'}`}>
                    {turnTimeLeft}s
                  </span>
                </div>
              </div>
            </div>

            {/* SURROUNDING PLAYERS ARENA RING */}
            <div className="w-full max-w-5xl bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[5px_5px_0px_#2C2A29] rounded-2xl p-4">
              <div className="text-xs font-black text-[#5C4033] border-b border-[#2C2A29]/20 pb-2 mb-3 flex items-center justify-between">
                <span>ترتيب دور المتسابقين في المجلس</span>
                <span className="font-bold text-[#2C2A29]/60">الهدف: تصفير الكروت (0)</span>
              </div>

              <div className="flex items-center justify-around gap-3 flex-wrap">
                {players.map((p, idx) => {
                  const isCurrentTurn = idx === activePlayerIndex;
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 transition-all ${
                        isCurrentTurn
                          ? 'bg-[#8A9A5B]/15 border-[#8A9A5B] shadow-[3px_3px_0px_#8A9A5B] scale-105'
                          : 'bg-[#E5E0D5]/50 border-[#2C2A29]/30 opacity-75'
                      }`}
                    >
                      <div className="flex flex-col text-right">
                        <span className="font-black text-sm text-[#2C2A29] flex items-center gap-1.5">
                          {p.name}
                          {isCurrentTurn && (
                            <span className="bg-[#8A9A5B] text-white text-[9px] font-black px-1.5 py-0.2 rounded-md">
                              دوره الآن
                            </span>
                          )}
                        </span>
                        <span className="text-[11px] font-bold text-[#5C4033]">
                          {p.cardsCount} كروت متبقية
                        </span>
                      </div>
                      
                      <div className="w-8 h-10 rounded-lg bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-sm flex items-center justify-center font-mono font-black text-xs text-[#2C2A29]">
                        {p.cardsCount}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* PHASE 3 & 4: ROUND WIN & PODIUM */}
        {(phase === 'ROUND_WIN' || phase === 'PODIUM') && (
          <div className="w-full max-w-3xl flex flex-col items-center gap-8 text-center my-auto">
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-[#8A9A5B] text-white border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] flex items-center justify-center mx-auto">
                <Award className="w-10 h-10" />
              </div>
              <h1 className="text-4xl font-black text-[#2C2A29]">
                مبروك! الفائز هو {winner?.name}
              </h1>
              <p className="text-sm font-bold text-[#2C2A29]/70">
                أول من صفّر كروته بالكامل ونزّل كروته الـ 7 في أرض المجلس (+15 pt)!
              </p>
            </div>

            {/* Final Cards Summary */}
            <div className="w-full bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[5px_5px_0px_#2C2A29] rounded-2xl p-6 space-y-3">
              <h3 className="font-black text-base text-[#2C2A29] border-b border-[#2C2A29]/20 pb-2 text-right">
                ترتيب نهاية الجولة
              </h3>
              <div className="space-y-2">
                {[...players]
                  .sort((a, b) => a.cardsCount - b.cardsCount)
                  .map((p, rank) => (
                    <div
                      key={p.id}
                      className={`p-3 rounded-xl border-2 flex items-center justify-between ${
                        rank === 0
                          ? 'bg-[#8A9A5B]/20 border-[#8A9A5B] font-black'
                          : 'bg-[#E5E0D5]/50 border-[#2C2A29]/20 font-bold'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm w-6 h-6 rounded-md bg-[#F7F4EC] border border-[#2C2A29] flex items-center justify-center">
                          #{rank + 1}
                        </span>
                        <span className="text-sm text-[#2C2A29]">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[#5C4033]">
                          {p.cardsCount === 0 ? 'صفّر الكروت' : `${p.cardsCount} كروت متبقية`}
                        </span>
                        {rank === 0 && (
                          <span className="bg-[#8A9A5B] text-white px-2.5 py-0.5 rounded-lg text-xs font-black">
                            +15 pt
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Restart Button */}
            <button
              onClick={startMatch}
              className="bg-[#8A9A5B] hover:bg-[#2C2A29] text-white px-8 py-3 rounded-2xl font-black text-base border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] transition-transform active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center gap-2"
            >
              <Shuffle className="w-5 h-5" />
              <span>بدء جولة جديدة</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
