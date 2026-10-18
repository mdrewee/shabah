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
import { getRandomBrokerItem } from './brokerItemsBank';
import { BrokerTopBar } from './components/BrokerTopBar';
import { BrokerHeroShowcase } from './components/BrokerHeroShowcase';
import { BrokerLeaderboard } from './components/BrokerLeaderboard';
import { BrokerMascotStage } from './components/BrokerMascotStage';
import { BrokerWinnerView } from './components/BrokerWinnerView';
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

  const [timerSeconds, setTimerSeconds] = useState(60);
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
            currentBid: prev.currentItem.openingBid,
            bulletsRemaining: 7,
            rank: Object.keys(updatedBids).length + 1,
            totalScore: 0,
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
          currentBid: prev.currentItem.openingBid,
          bulletsRemaining: 7,
          rank: 1,
          totalScore: 0,
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

        // Add announcement if available
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

    return () => {
      unsubBid();
    };
  }, [roomCode]);

  // Round Timer Countdown during AUCTION phase
  useEffect(() => {
    if (brokerState.phase !== 'AUCTION') return;

    setTimerSeconds(60);

    const interval = window.setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          handleRoundTimeout();
          return 0;
        }
        if (prev === 11) {
          sound.playTimerWarning();
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [brokerState.phase, brokerState.roundNumber]);

  const handleRoundTimeout = () => {
    const cur = brokerStateRef.current;
    const ranked = sortAndRankContestants(cur.contestantBids);

    if (ranked.length > 0) {
      const winner = ranked[0];
      const updatedBids = { ...cur.contestantBids };
      if (updatedBids[winner.playerId]) {
        updatedBids[winner.playerId] = {
          ...updatedBids[winner.playerId],
          totalScore: (updatedBids[winner.playerId].totalScore || 0) + 5,
        };
      }

      const nextState: BrokerRoomState = {
        ...cur,
        phase: 'ROUND_WINNER',
        contestantBids: updatedBids,
        winnerId: winner.playerId,
        winnerName: winner.playerName,
        winningBid: winner.currentBid,
        winningQuote: winner.bestQuote || 'أقنع الشريطي بأعلى سومة في الحراج!',
      };

      setBrokerState(nextState);
      roomBus.broadcastBrokerSync(roomCode, nextState);
    } else {
      // No contestants yet, stay in auction or reset
      setTimerSeconds(60);
    }
  };

  const handleStartGame = () => {
    sound.playSuccess();
    const firstItem = getRandomBrokerItem();

    // Reset contestant bids for the new item
    const resetBids: Record<string, ContestantBidState> = {};
    mergedContestants.forEach((p, idx) => {
      resetBids[p.id] = {
        playerId: p.id,
        playerName: p.name || 'متسابق',
        currentBid: firstItem.openingBid,
        bulletsRemaining: 7,
        rank: idx + 1,
        totalScore: 0,
      };
    });

    const nextState: BrokerRoomState = {
      ...brokerState,
      phase: 'AUCTION',
      roundNumber: 1,
      currentItem: firstItem,
      contestantBids: resetBids,
      announcements: [
        {
          id: `start_${Date.now()}`,
          text: `بدأ مزاد السلعة: ${firstItem.name}! فتحة السوم ${firstItem.openingBid} ريال.`,
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
  };

  const handleNextRound = () => {
    sound.playSuccess();
    const newItem = getRandomBrokerItem();

    const resetBids: Record<string, ContestantBidState> = {};
    Object.values(brokerState.contestantBids).forEach((c) => {
      resetBids[c.playerId] = {
        ...c,
        currentBid: newItem.openingBid,
        bulletsRemaining: 7,
        bestQuote: undefined,
        lastBidIncrease: undefined,
      };
    });

    const nextState: BrokerRoomState = {
      ...brokerState,
      phase: 'AUCTION',
      roundNumber: brokerState.roundNumber + 1,
      currentItem: newItem,
      contestantBids: resetBids,
      announcements: [
        {
          id: `r_${Date.now()}`,
          text: `بدأت جولة جديدة مع سلعة جديدة: ${newItem.name}!`,
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

  // Phase 3: Round Winner View
  if (brokerState.phase === 'ROUND_WINNER' && brokerState.winnerName && brokerState.winningBid) {
    return (
      <BrokerWinnerView
        item={brokerState.currentItem}
        winnerName={brokerState.winnerName}
        winningBid={brokerState.winningBid}
        winningQuote={brokerState.winningQuote || undefined}
        onNextRound={handleNextRound}
        onReturnToLobby={handleReturnToLobby}
      />
    );
  }

  // Phase 2: Live Auction Broadcast View
  const rankedContestants = sortAndRankContestants(brokerState.contestantBids);
  const topBid = rankedContestants[0]?.currentBid || brokerState.currentItem.openingBid;
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
        remark="المزاد مباشر! اضغط على اللوبي لإنهاء الجولة في أي وقت"
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
