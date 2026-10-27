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
import { getNextUniqueBrokerItem, getBrokerItemByIndex } from '../../../data/brokerItems';
import { BrokerTopBar } from './components/BrokerTopBar';
import { BrokerHeroShowcase } from './components/BrokerHeroShowcase';
import { BrokerLeaderboard } from './components/BrokerLeaderboard';
import { BrokerMascotStage } from './components/BrokerMascotStage';
import { BrokerShowcaseStage } from './components/BrokerShowcaseStage';
import { BrokerRoundWinner } from './components/BrokerRoundWinner';
import { BrokerFinalPodium } from './components/BrokerFinalPodium';
import { ShabahMood } from '../../../components/mascot/ShabahGhost';

export const BrokerTVRoot: React.FC = () => {
  const { code: rawCode } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const roomCode = (rawCode || 'SHBH').trim().toUpperCase();

  const { room } = useRoom(roomCode);
  const activeRoom = room || roomBus.getRoom(roomCode);

  // Stable Supabase Realtime presence connection for TV Host
  const { connectedPlayers: realtimeContestants } = useRoomSync({
    roomCode,
    role: 'host',
  });

  const [brokerState, setBrokerState] = useState<BrokerRoomState>(() =>
    createInitialBrokerState(roomCode)
  );

  const brokerStateRef = useRef(brokerState);
  useEffect(() => {
    brokerStateRef.current = brokerState;
    savePersistedBrokerState(roomCode, brokerState);
  }, [brokerState, roomCode]);

  const [timerSeconds, setTimerSeconds] = useState(180);
  const [highlightedPlayerId, setHighlightedPlayerId] = useState<string | null>(null);
  const [mascotMood, setMascotMood] = useState<ShabahMood>('judging');

  // Merged connected contestants
  const mergedContestants =
    realtimeContestants.length > 0
      ? realtimeContestants
      : (activeRoom?.players || []).filter((p) => p.id !== 'host_tv');

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

  // Listen for contestant bid updates from mobile
  useEffect(() => {
    const unsubBid = roomBus.on('BROKER_BID_SUBMITTED', (evt: any) => {
      const payload = evt?.data || evt;
      if (!payload || !payload.playerId) return;

      const {
        playerId,
        playerName,
        newBid,
        bidIncrease,
        quote,
        announcement,
        bulletsRemaining,
      } = payload;

      setBrokerState((prev) => {
        const existing = prev.contestantBids[playerId] || {
          playerId,
          playerName: playerName || 'متسابق',
          currentBid: 0,
          bulletsRemaining: 7,
          rank: 1,
          totalBankroll: 0,
          isReadyForNextRound: false,
        };

        const updated: ContestantBidState = {
          ...existing,
          currentBid: newBid,
          bulletsRemaining:
            bulletsRemaining !== undefined ? bulletsRemaining : existing.bulletsRemaining,
          bestQuote: quote || existing.bestQuote,
          lastBidIncrease: bidIncrease,
          lastBidTimestamp: Date.now(),
        };

        const newMap = {
          ...prev.contestantBids,
          [playerId]: updated,
        };

        const ranked = sortAndRankContestants(newMap);
        const rankedMap: Record<string, ContestantBidState> = {};
        ranked.forEach((c) => {
          rankedMap[c.playerId] = c;
        });

        const updatedAnnouncements = announcement
          ? [
              ...prev.announcements,
              { id: `ann_${Date.now()}`, text: announcement, timestamp: Date.now() },
            ]
          : prev.announcements;

        const next = {
          ...prev,
          contestantBids: rankedMap,
          announcements: updatedAnnouncements,
        };

        roomBus.broadcastBrokerSync(roomCode, next);
        return next;
      });

      // Highlight the bidding contestant card on TV
      if (bidIncrease > 0) {
        sound.playCash();
        setHighlightedPlayerId(playerId);
        setMascotMood('happy');
        window.setTimeout(() => {
          setHighlightedPlayerId(null);
          setMascotMood('judging');
        }, 1200);
      } else {
        sound.playBuzz();
        setMascotMood('angry');
        window.setTimeout(() => {
          setMascotMood('judging');
        }, 1200);
      }
    });

    // Listen for contestant readiness updates in ROUND_WINNER phase
    const unsubReady = roomBus.on('PLAYER_READY_UPDATE', (evt: any) => {
      const payload = evt?.data || evt;
      if (!payload || !payload.playerId) return;

      setBrokerState((prev) => {
        if (!prev.contestantBids[payload.playerId]) return prev;

        const updatedBids = {
          ...prev.contestantBids,
          [payload.playerId]: {
            ...prev.contestantBids[payload.playerId],
            isReadyForNextRound: payload.isReady !== undefined ? payload.isReady : true,
          },
        };

        const next = { ...prev, contestantBids: updatedBids };
        roomBus.broadcastBrokerSync(roomCode, next);

        // Check if all active contestants are ready
        const allReady = Object.values(updatedBids).every((c: any) => c.isReadyForNextRound);
        if (allReady && Object.keys(updatedBids).length > 0) {
          window.setTimeout(() => {
            handleAdvanceFromRound();
          }, 800);
        }

        return next;
      });
    });

    return () => {
      unsubBid();
      unsubReady();
    };
  }, [roomCode]);

  // Timer Countdown during NEGOTIATION phase (180 seconds / 3 minutes)
  useEffect(() => {
    if (brokerState.phase !== 'NEGOTIATION') return;

    setTimerSeconds(180);

    const interval = window.setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          handleRoundTimeout();
          return 0;
        }
        if (prev === 11) {
          sound.playTimerWarning?.();
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [brokerState.phase, brokerState.roundNumber]);

  // Round Negotiation Timeout -> Evaluate Winner & Advance to ROUND_WINNER
  const handleRoundTimeout = () => {
    const cur = brokerStateRef.current;
    const ranked = sortAndRankContestants(cur.contestantBids);

    if (ranked.length > 0) {
      const winner = ranked[0];
      const winningAmount = winner.currentBid;

      const updatedBids = { ...cur.contestantBids };
      if (updatedBids[winner.playerId]) {
        updatedBids[winner.playerId] = {
          ...updatedBids[winner.playerId],
          totalBankroll: (updatedBids[winner.playerId].totalBankroll || 0) + winningAmount,
        };
      }

      // Reset isReadyForNextRound for all
      Object.keys(updatedBids).forEach((pid) => {
        updatedBids[pid].isReadyForNextRound = false;
      });

      const nextState: BrokerRoomState = {
        ...cur,
        phase: 'ROUND_WINNER',
        contestantBids: updatedBids,
        winnerId: winner.playerId,
        winnerName: winner.playerName,
        winningBid: winningAmount,
        winningQuote: winner.bestQuote || 'أقنع الشريطي بالذكاء والسرعة وفاز بالسومة!',
      };

      setBrokerState(nextState);
      roomBus.broadcastBrokerSync(roomCode, nextState);
    } else {
      setTimerSeconds(180);
    }
  };

  // Start Game from Lobby: initialize 5 rounds, item 1, go to SHOWCASE
  const handleStartGame = () => {
    sound.playSuccess();
    const firstItem = getNextUniqueBrokerItem([]);

    const resetBids: Record<string, ContestantBidState> = {};
    mergedContestants.forEach((p, idx) => {
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
      ...brokerState,
      phase: 'SHOWCASE',
      roundNumber: 1,
      totalRounds: 5,
      currentItem: firstItem,
      usedItemIds: [firstItem.id],
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
  };

  // Complete 10s Showcase -> Move to NEGOTIATION (180s)
  const handleShowcaseComplete = () => {
    sound.playClick();
    const cur = brokerStateRef.current;
    const nextState: BrokerRoomState = {
      ...cur,
      phase: 'NEGOTIATION',
      announcements: [
        ...cur.announcements,
        {
          id: `neg_${Date.now()}`,
          text: `بدأ وقت السوم والمفاوضات! معكم ٣ دقائق لرفع السوم.`,
          timestamp: Date.now(),
        },
      ],
    };
    setBrokerState(nextState);
    roomBus.broadcastBrokerSync(roomCode, nextState);
  };

  // Advance from ROUND_WINNER to next round SHOWCASE or FINAL_PODIUM
  const handleAdvanceFromRound = () => {
    const cur = brokerStateRef.current;

    // Check if 5 rounds completed
    if (cur.roundNumber >= cur.totalRounds) {
      sound.playVictory();
      const nextState: BrokerRoomState = {
        ...cur,
        phase: 'FINAL_PODIUM',
      };
      setBrokerState(nextState);
      roomBus.broadcastBrokerSync(roomCode, nextState);
      return;
    }

    // Advance to next round
    sound.playSuccess();
    const nextRound = cur.roundNumber + 1;
    const currentUsedIds = cur.usedItemIds || (cur.currentItem ? [cur.currentItem.id] : []);
    const nextItem = getNextUniqueBrokerItem(currentUsedIds);
    const updatedUsedIds = [...currentUsedIds, nextItem.id];

    const resetBids: Record<string, ContestantBidState> = {};
    Object.values(cur.contestantBids).forEach((c) => {
      resetBids[c.playerId] = {
        ...c,
        currentBid: 0,
        bulletsRemaining: 7,
        bestQuote: undefined,
        lastBidIncrease: undefined,
        isReadyForNextRound: false,
      };
    });

    const nextState: BrokerRoomState = {
      ...cur,
      phase: 'SHOWCASE',
      roundNumber: nextRound,
      currentItem: nextItem,
      usedItemIds: updatedUsedIds,
      contestantBids: resetBids,
      announcements: [
        ...cur.announcements,
        {
          id: `r_${Date.now()}`,
          text: `بدأت الجولة ${nextRound}! معاينة: ${nextItem.name}`,
          timestamp: Date.now(),
        },
      ],
      winnerId: null,
      winnerName: null,
      winningBid: null,
      winningQuote: null,
    };

    setBrokerState(nextState);
    roomBus.broadcastBrokerSync(roomCode, nextState);
    roomBus.broadcast(roomCode, 'BROKER_NEW_ROUND', { state: nextState });
    roomBus.broadcast(roomCode, 'BROKER_ITEM_SYNC', { item: nextItem, roundNumber: nextRound });
  };

  const handleReturnToLobby = () => {
    sound.playClick();
    const nextState: BrokerRoomState = {
      ...brokerState,
      phase: 'LOBBY',
      roundNumber: 1,
      winnerId: null,
      winnerName: null,
      winningBid: null,
      winningQuote: null,
    };
    setBrokerState(nextState);
    roomBus.broadcastReturnToLobby(roomCode);
    roomBus.broadcastBrokerSync(roomCode, nextState);
  };

  const handleExit = () => {
    sound.playClick();
    roomBus.emit('ROOM_CLOSED', roomCode, { reason: 'HOST_CLOSED' });
    roomBus.emit('ROOM_TERMINATED', roomCode, { reason: 'HOST_CLOSED' });
    navigate('/');
  };

  // Phase 1: Lobby View
  if (brokerState.phase === 'LOBBY') {
    return (
      <UnifiedShabahLobby
        roomCode={roomCode}
        gameId="ai-broker"
        gameTitle="الشبح الشريطي"
        role="host"
        onStartGame={handleStartGame}
        onExit={handleExit}
      />
    );
  }

  // Phase 2: Pre-round Showcase View (10 seconds)
  if (brokerState.phase === 'SHOWCASE') {
    return (
      <BrokerShowcaseStage
        item={brokerState.currentItem}
        roundNumber={brokerState.roundNumber}
        totalRounds={brokerState.totalRounds}
        durationSeconds={10}
        onComplete={handleShowcaseComplete}
        isHost
      />
    );
  }

  // Phase 4: Round Winner View
  if (brokerState.phase === 'ROUND_WINNER' && brokerState.winnerName && brokerState.winningBid !== null) {
    return (
      <BrokerRoundWinner
        item={brokerState.currentItem}
        roundNumber={brokerState.roundNumber}
        totalRounds={brokerState.totalRounds}
        winnerName={brokerState.winnerName}
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
          item={brokerState.currentItem}
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
