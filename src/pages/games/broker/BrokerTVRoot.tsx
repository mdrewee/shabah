import {useRoundTransition} from '../../../hooks/useRoundTransition';
import { beginBrokerNegotiation, nextBrokerRound, finishBrokerRound, acceptsBrokerPitch } from './brokerRound';
import { evaluateBrokerPitch } from '../../../services/brokerEngine';
import { useGameState } from '../../../hooks/useGameState';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom, roomBus } from '../../../lib/roomBus';
import { useRoomSync } from '../../../hooks/useRoomSync';
import { sound } from '../../../lib/audio';
import { UnifiedShabahLobby } from '../../../components/lobby/UnifiedShabahLobby';
import { BrokerRoomState, ContestantBidState } from './types';
import {
  createInitialBrokerState,
  savePersistedBrokerState,
  sortAndRankContestants,
} from './brokerSync';
import { getNextUniqueBrokerItem, getBrokerItemByIndex, ensureBrokerItem } from '../../../data/brokerItems';
import { BrokerTopBar } from './components/BrokerTopBar';
import { BrokerHeroShowcase } from './components/BrokerHeroShowcase';
import { BrokerLeaderboard } from './components/BrokerLeaderboard';
import { BrokerMascotStage } from './components/BrokerMascotStage';
import { BrokerShowcaseStage } from './components/BrokerShowcaseStage';
import { BrokerRoundWinner } from './components/BrokerRoundWinner';
import { BrokerFinalPodium } from './components/BrokerFinalPodium';
import { ShabahMood } from '../../../components/mascot/ShabahGhost';

export const BrokerTVRoot: React.FC<{ mobileContestants?: Array<{ id: string; name: string }> }> = ({ mobileContestants }) => {
  const { code: rawCode } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const roomCode = (rawCode || 'SHBH').trim().toUpperCase();

  const { room } = useRoom(roomCode);
  const activeRoom = room || roomBus.getRoom(roomCode);

  // Stable Supabase Realtime presence connection for TV Host
  const { connectedPlayers: realtimeContestants, hasPresenceSnapshot } = useRoomSync({
    roomCode: mobileContestants ? '' : roomCode,
    role: 'host',
  });

  const [brokerState, setBrokerState, brokerStateRef] = useGameState<BrokerRoomState>(() =>
    createInitialBrokerState(roomCode)
  );


  useEffect(() => roomBus.on('REQUEST_ROOM_STATE', () => {
    roomBus.broadcastBrokerSync(roomCode, brokerStateRef.current);
  }, roomCode), [roomCode]);
  useEffect(() => {
    brokerStateRef.current = brokerState;
    savePersistedBrokerState(roomCode, brokerState);
  }, [brokerState, roomCode]);

  const [timerSeconds, setTimerSeconds] = useState(180);
  const [highlightedPlayerId, setHighlightedPlayerId] = useState<string | null>(null);
  const [mascotMood, setMascotMood] = useState<ShabahMood>('judging');

  // Merged connected contestants
  const mergedContestants = mobileContestants ?? (
    hasPresenceSnapshot || realtimeContestants.length > 0
      ? realtimeContestants
      : (activeRoom?.players || []).filter((p) => p.id !== 'host_tv'));

  const mergedContestantsRef = useRef(mergedContestants);
  useEffect(() => {
    mergedContestantsRef.current = mergedContestants;
  }, [mergedContestants]);

  // Keep contestant bids map populated with all connected players
  useEffect(() => {
    if (mergedContestants.length === 0) return;

    setBrokerState((prev) => {
      let changed = false;
      const updatedBids: Record<string, ContestantBidState> = { ...prev.contestantBids };

      mergedContestants.forEach((p) => {
        if (!updatedBids[p.id]) {
          changed = true;
          updatedBids[p.id] = {
            playerId: p.id,
            playerName: p.name || 'متسابق',
            currentBid: 0,
            bulletsRemaining: 7,
            rank: Object.keys(updatedBids).length + 1,
            totalBankroll: 0,
            isReadyForNextRound: false,
          };
        }
      });

      if (!changed) return prev;

      const ranked = sortAndRankContestants(updatedBids);
      const rankedMap: Record<string, ContestantBidState> = {};
      ranked.forEach((c) => {
        rankedMap[c.playerId] = c;
      });

      const next = { ...prev, contestantBids: rankedMap };
      roomBus.broadcastBrokerSync(roomCode, next);
      return next;
    });
  }, [mergedContestants, roomCode]);

  const pendingPitches = useRef(new Map<string, string>());

  // Listen for contestant bid updates from mobile
  useEffect(() => {
    const unsubBid = roomBus.on('BROKER_BID_SUBMITTED', async evt => {
      if (evt.roomCode !== roomCode) return;
      const p = evt.data;
      const cur = brokerStateRef.current;
      const member = mergedContestantsRef.current.find(c => c.id === p?.playerId);
      const bid = cur.contestantBids[p?.playerId];
      if (!member || !acceptsBrokerPitch(cur, p, mergedContestantsRef.current.map(c => c.id), pendingPitches.current.has(p?.playerId))) return;
      pendingPitches.current.set(p.playerId, p.requestId);
      try {
        const result = await evaluateBrokerPitch({ item: cur.currentItem, pitch: p.pitch,
          currentBid: bid.currentBid, isFirstBid: bid.currentBid === 0, playerName: member.name });
        const latest = brokerStateRef.current;
        if (latest.phase !== 'NEGOTIATION' || latest.roundNumber !== cur.roundNumber ||
            latest.currentItem.id !== cur.currentItem.id || latest.gameStartedAt !== cur.gameStartedAt || Date.now() >= (latest.roundEndsAt || 0)) throw new Error('انتهت الجولة');
        const updated = { ...bid, currentBid: result.newBid, bulletsRemaining: bid.bulletsRemaining - 1,
          lastRequestId: p.requestId, lastBidTimestamp: result.bidIncrease > 0 ? Date.now() : bid.lastBidTimestamp,
          lastBidIncrease: result.bidIncrease,
          bestQuote: result.persuasionScore > (bid.bestPitchScore || 0) ? p.pitch : bid.bestQuote,
          bestPitchScore: Math.max(bid.bestPitchScore || 0, result.persuasionScore) };
        const next: BrokerRoomState = { ...latest, contestantBids: { ...latest.contestantBids, [p.playerId]: updated },
          announcements: [...latest.announcements, { id:p.requestId, text:result.publicAnnouncement, timestamp:Date.now() }] };
        setBrokerState(next);
        roomBus.broadcastBrokerSync(roomCode, next);
        roomBus.emit('AI_RESPONSE', roomCode, { kind:'broker', requestId:p.requestId, result });
        const activeIds = mergedContestantsRef.current.map(c => c.id);
        if (activeIds.length && activeIds.every(id => next.contestantBids[id]?.bulletsRemaining === 0)) {
          const finished = finishBrokerRound(next, activeIds);
          setBrokerState(finished);
          roomBus.broadcastBrokerSync(roomCode, finished);
        }
      } catch {
        roomBus.emit('AI_RESPONSE', roomCode, { kind:'broker', requestId:p.requestId, error:true });
      } finally { if (pendingPitches.current.get(p.playerId) === p.requestId) pendingPitches.current.delete(p.playerId); }
    }, roomCode);
    const unsubControl = roomBus.on('BROKER_ITEM_SYNC', evt => {
      if (evt.data?.action === 'startNegotiation') handleShowcaseComplete();
      if (evt.data?.action === 'advanceRound') handleAdvanceFromRound();
    }, roomCode);

    // Listen for contestant readiness updates ONLY in ROUND_WINNER phase
    const unsubReady = roomBus.on('PLAYER_READY_UPDATE', (evt: any) => {
      const payload = evt?.data || evt;
      if (evt.roomCode !== roomCode || !payload || !mergedContestantsRef.current.some(c => c.id === payload.playerId)) return;

      setBrokerState((prev) => {
        if (prev.phase !== 'ROUND_WINNER') return prev;
        if (!prev.contestantBids[payload.playerId]) return prev;

        const updatedBids: Record<string, ContestantBidState> = {
          ...prev.contestantBids,
          [payload.playerId]: {
            ...prev.contestantBids[payload.playerId],
            isReadyForNextRound: payload.isReady !== undefined ? payload.isReady : true,
          },
        };

        const next = { ...prev, contestantBids: updatedBids };
        roomBus.broadcastBrokerSync(roomCode, next);

        // Check if all active contestants are ready
        const allReady = mergedContestantsRef.current.length > 0 && mergedContestantsRef.current.every(c => updatedBids[c.id]?.isReadyForNextRound);
        if (allReady && Object.keys(updatedBids).length > 0) {
          window.setTimeout(() => {
            const state = brokerStateRef.current;
            if (mergedContestantsRef.current.length && mergedContestantsRef.current.every(c => state.contestantBids[c.id]?.isReadyForNextRound)) handleAdvanceFromRound();
          }, 800);
        }

        return next;
      });
    });

    // Listen for mobile host starting the game
    const unsubHostStart = roomBus.on('GAME_STARTED', () => {
      if (brokerStateRef.current.phase === 'LOBBY') {
        handleStartGame();
      }
    });

    return () => {
      unsubBid();
      unsubControl();
      unsubReady();
      unsubHostStart();
    };
  }, [roomCode]);

  // Timer Countdown during NEGOTIATION phase (180 seconds / 3 minutes)
  useEffect(() => {
    if (brokerState.phase !== 'NEGOTIATION') return;

    const endsAt = brokerState.roundEndsAt || Date.now() + 180000;
    const tick = () => {
      const current = brokerStateRef.current;
      if (current.phase !== 'NEGOTIATION') return;
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setTimerSeconds(remaining);
      const next = { ...current, timerSeconds: remaining, roundEndsAt: endsAt };
      setBrokerState(next);
      roomBus.broadcastBrokerSync(roomCode, next);
      if (remaining === 10) sound.playTimerWarning?.();
      if (remaining === 0) handleRoundTimeout();
    };
    const interval = window.setInterval(tick, 1000);
    tick();

    return () => window.clearInterval(interval);
  }, [brokerState.phase, brokerState.roundNumber]);

  // Round Negotiation Timeout -> Evaluate Winner & Advance to ROUND_WINNER
  const handleRoundTimeout = () => {
    const cur = brokerStateRef.current;
    if (cur.phase !== 'NEGOTIATION') return;
    const next = finishBrokerRound(cur, mergedContestantsRef.current.map(c => c.id));
    setBrokerState(next);
    roomBus.broadcastBrokerSync(roomCode, next);
  };

  // Start Game from Lobby: initialize 5 rounds, item 1, go to SHOWCASE
  const handleStartGame = () => {
    const cur = brokerStateRef.current;
    if (cur.phase !== 'LOBBY') return;

    sound.playSuccess();
    const { item: firstItem, updatedUsedIds } = getNextUniqueBrokerItem([]);

    const resetBids: Record<string, ContestantBidState> = {};
    const currentPlayers = mergedContestantsRef.current;
    currentPlayers.forEach((p, idx) => {
      resetBids[p.id] = {
        playerId: p.id,
        playerName: p.name || 'متسابق',
        currentBid: 0,
        bulletsRemaining: 7,
        rank: idx + 1,
        totalBankroll: 0,
        isReadyForNextRound: false,
      };
    });

    const nextState: BrokerRoomState = {
      ...cur,
      phase: 'SHOWCASE',
      gameStartedAt: Date.now(),
      timerSeconds: 10,
      roundEndsAt: undefined,
      roundNumber: 1,
      totalRounds: 5,
      currentItem: firstItem,
      usedItemIds: updatedUsedIds,
      contestantBids: resetBids,
      announcements: [
        {
          id: `start_${Date.now()}`,
          text: `بدأت الجولة الأولى! معاينة السلعة: ${firstItem.name}`,
          timestamp: Date.now(),
        },
      ],
      winnerId: null,
      winnerName: null,
      winningBid: null,
      winningQuote: null,
    };

    setBrokerState(nextState);
    roomBus.broadcastGameStarted(roomCode, { gameId: 'ai-broker', state: nextState });
    roomBus.broadcastBrokerSync(roomCode, nextState);
    roomBus.broadcast(roomCode, 'BROKER_ITEM_SYNC', { item: firstItem, roundNumber: 1 });
  };

  // Complete 10s Showcase -> Move to NEGOTIATION (180s)
  const handleShowcaseComplete = () => {
    const cur = brokerStateRef.current;
    const next = beginBrokerNegotiation(cur);
    if (next === cur) return;
    setBrokerState(next);
    roomBus.broadcastBrokerSync(roomCode, next);
  };

  // Advance from ROUND_WINNER to next round SHOWCASE or FINAL_PODIUM
  const handleAdvanceFromRound = () => {
    const cur = brokerStateRef.current;
    if (cur.phase !== 'ROUND_WINNER') return;
    pendingPitches.current.clear();
    const { item } = getNextUniqueBrokerItem(cur.usedItemIds || []);
    const next = nextBrokerRound(cur, item);
    setBrokerState(next);
    roomBus.broadcastBrokerSync(roomCode, next);
  };

  const handleReturnToLobby = () => {
    sound.playClick();
    const nextState = createInitialBrokerState(roomCode, true);
    setBrokerState(nextState);
    roomBus.broadcastReturnToLobby(roomCode);
    roomBus.broadcastBrokerSync(roomCode, nextState);
  };

  const handleExit = async () => {
    sound.playClick();
    if (await roomBus.terminateRoom(roomCode)) navigate('/');
    else alert('تعذر إنهاء الغرفة، حاول مرة أخرى');
  };

  // Phase 1: Lobby View
  useEffect(() => roomBus.on('BROKER_STATE_SYNC', (event) => {
    brokerStateRef.current = event.data;
    setBrokerState(event.data);
  }, roomCode), [roomCode]);

  useEffect(() => roomBus.on('RETURN_TO_LOBBY', () => {
    const fresh = createInitialBrokerState(roomCode, true);
    brokerStateRef.current = fresh;
    setBrokerState(fresh);
    roomBus.broadcastBrokerSync(roomCode, fresh);
  }, roomCode), [roomCode]);

  useEffect(() => {
    if (!mobileContestants || brokerState.phase !== 'SHOWCASE') return;
    const timer = setTimeout(handleShowcaseComplete, 10000);
    return () => clearTimeout(timer);
  }, [mobileContestants, brokerState.phase]);

  useRoundTransition(brokerState.phase==='ROUND_WINNER'?'ROUND_WINNER:'+brokerState.roundNumber:null,brokerState.roundTransition,
    roundTransition=>{const next={...brokerStateRef.current,roundTransition};setBrokerState(next);roomBus.broadcastBrokerSync(roomCode,next);},handleAdvanceFromRound);
  if (mobileContestants) return null;

  if (brokerState.phase === 'LOBBY') {
    return (
      <UnifiedShabahLobby
        roomCode={roomCode}
        gameId="ai-broker"
        gameTitle="الشبح الشريطي"
        role="host"
        onExit={handleExit}
      />
    );
  }

  const safeCurrentItem = ensureBrokerItem(brokerState.currentItem, brokerState.roundNumber);

  // Phase 2: Pre-round Showcase View (10 seconds)
  if (brokerState.phase === 'SHOWCASE') {
    return (
      <BrokerShowcaseStage
        item={safeCurrentItem}
        roundNumber={brokerState.roundNumber}
        totalRounds={brokerState.totalRounds}
        durationSeconds={10}
        onComplete={handleShowcaseComplete}
        isHost
      />
    );
  }

  // Phase 4: Round Winner View
  if (brokerState.phase === 'ROUND_WINNER') {
    return (
      <BrokerRoundWinner
        item={safeCurrentItem}
        roundNumber={brokerState.roundNumber}
        totalRounds={brokerState.totalRounds}
        winnerName={brokerState.winnerName || 'لا توجد سومات'}
        winningBid={brokerState.winningBid || 0}
        winningQuote={brokerState.winningQuote || undefined}
        contestants={Object.values(brokerState.contestantBids)}
        isHost
        onNextRound={handleAdvanceFromRound}
        onReturnToLobby={handleReturnToLobby}
      />
    );
  }

  // Phase 5: Final 5-Round Podium View
  if (brokerState.phase === 'FINAL_PODIUM') {
    return (
      <BrokerFinalPodium
        contestants={Object.values(brokerState.contestantBids)}
        totalRounds={brokerState.totalRounds}
        onReturnToLobby={handleReturnToLobby}
        isHost
      />
    );
  }

  // Phase 3: Live Negotiation & Auction Broadcast View (180s)
  const rankedContestants = sortAndRankContestants(brokerState.contestantBids);
  const topBid = rankedContestants[0]?.currentBid || 0;
  const topBidder = rankedContestants[0]?.playerName;

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full bg-[#000000] text-[#FFFFFF] flex flex-col justify-between selection:bg-white selection:text-black overflow-x-hidden"
    >
      {/* Top Bar */}
      <BrokerTopBar
        roomCode={roomCode}
        roundNumber={brokerState.roundNumber}
        timerSeconds={timerSeconds}
        mood={mascotMood}
        remark="المزاد مباشر! ساوم الشريطي عبر جوالك لرفع السومة"
        isHost
        onReturnToLobby={handleReturnToLobby}
        onExit={handleExit}
      />

      {/* Main Broadcast Stage */}
      <main className="flex-1 w-full flex flex-col items-center justify-start py-6 px-4 gap-6">
        {/* Hero Item Showcase Card */}
        <BrokerHeroShowcase
          item={safeCurrentItem}
          topBid={topBid}
          topBidderName={topBidder}
        />

        {/* Live Auction Leaderboard */}
        <BrokerLeaderboard
          contestants={rankedContestants}
          highlightedPlayerId={highlightedPlayerId}
        />

        {/* Mascot Persona Stage with Live Announcement Ticker */}
        <BrokerMascotStage
          mood={mascotMood}
          announcements={brokerState.announcements}
        />
      </main>
    </div>
  );
};
