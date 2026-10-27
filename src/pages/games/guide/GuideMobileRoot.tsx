import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom, roomBus } from '../../../lib/roomBus';
import { useRoomSync } from '../../../hooks/useRoomSync';
import { sound } from '../../../lib/audio';
import { UnifiedShabahLobby } from '../../../components/lobby/UnifiedShabahLobby';
import { GuideRoomState } from './types';
import { createInitialGuideState, getRankedGuideContestants } from './guideSync';
import {
  getOrCreatePlayerId,
  getOrCreatePlayerName,
  getPersistedPlayerName,
} from '../../../utils/playerSession';
import { GuideMobileView } from './components/GuideMobileView';
import { GuideResultsStage } from './components/GuideResultsStage';
import { GuideFinalPodium } from './components/GuideFinalPodium';
import { Compass, Sparkles } from 'lucide-react';

export const GuideMobileRoot: React.FC = () => {
  const { code: rawCode } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const roomCode = (rawCode || 'SHBH').trim().toUpperCase();

  const [playerId] = useState<string>(() => getOrCreatePlayerId());
  const [playerName] = useState<string>(() => {
    return getPersistedPlayerName() || getOrCreatePlayerName('رحالة');
  });

  // Maintain Supabase Realtime channel
  useRoomSync({
    roomCode,
    role: 'contestant',
    playerId,
    playerName,
  });

  const { room } = useRoom(roomCode);
  const activeRoom = room || roomBus.getRoom(roomCode);

  const [guideState, setGuideState] = useState<GuideRoomState>(() =>
    createInitialGuideState(roomCode)
  );

  const [hasSubmittedThisRound, setHasSubmittedThisRound] = useState<boolean>(false);
  const [isReadyForNextRound, setIsReadyForNextRound] = useState<boolean>(false);

  // Synchronize with TV host state & instant game start
  useEffect(() => {
    const unsubStart = roomBus.on('GAME_STARTED', (evt: any) => {
      const incomingCode = evt?.roomCode;
      const payload = evt?.data ?? evt;
      if (incomingCode && incomingCode !== roomCode) return;
      if (!payload) return;

      // Deterministic instant switch without waiting for Supabase
      if (payload.state) {
        setGuideState(payload.state);
      } else {
        setGuideState((prev) => ({
          ...prev,
          phase: 'INTRO',
          roundNumber: payload.roundNumber || 1,
          currentLandmark: payload.landmark || prev.currentLandmark,
        }));
      }
      setHasSubmittedThisRound(false);
      setIsReadyForNextRound(false);
    });

    const unsubSync = roomBus.on('GUIDE_STATE_SYNC', (evt: any) => {
      const incomingCode = evt?.roomCode;
      const payload = evt?.data ?? evt;
      if (incomingCode && incomingCode !== roomCode) return;
      if (!payload) return;

      setGuideState(payload);

      // Reset submission flag when a new round starts
      if (payload.phase === 'INTRO' || payload.phase === 'GUESSING') {
        setIsReadyForNextRound(false);
      }
      if (payload.phase === 'INTRO') {
        setHasSubmittedThisRound(false);
      }
    });

    const unsubLobby = roomBus.on('RETURN_TO_LOBBY', (evt: any) => {
      const incomingCode = evt?.roomCode;
      if (incomingCode && incomingCode !== roomCode) return;
      setGuideState((prev) => ({
        ...prev,
        phase: 'LOBBY',
      }));
      setHasSubmittedThisRound(false);
      setIsReadyForNextRound(false);
    });

    return () => {
      unsubStart?.();
      unsubSync?.();
      unsubLobby?.();
    };
  }, [roomCode]);

  // Local fluid countdown and clue progression on mobile (prevents network flood)
  useEffect(() => {
    if (guideState.phase !== 'GUESSING') return;

    const interval = setInterval(() => {
      setGuideState((prev) => {
        if (prev.phase !== 'GUESSING') return prev;
        const nextSec = Math.max(0, prev.timerSeconds - 1);
        const elapsed = 60 - nextSec;
        const nextClueIdx = Math.min(4, Math.floor(elapsed / 12));

        return {
          ...prev,
          timerSeconds: nextSec,
          activeClueIndex: Math.max(prev.activeClueIndex, nextClueIdx),
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [guideState.phase]);

  // Audio Kill-Switch on phase changes
  useEffect(() => {
    return () => {
      sound.stopAllAudio();
    };
  }, [guideState.phase]);

  // Handle Pin Lock & Submission
  const handleLockPin = (coords: { lat: number; lng: number }) => {
    if (hasSubmittedThisRound) return;
    setHasSubmittedThisRound(true);
    sound.playVictory();

    const cId = playerId || getOrCreatePlayerId();
    const cName = playerName || getPersistedPlayerName() || 'رحالة';

    roomBus.broadcastGuidePin(roomCode, {
      contestantId: cId,
      contestantName: cName,
      lat: coords.lat,
      lng: coords.lng,
      submittedAt: Date.now(),
    });
  };

  // Handle Ready Toggle in Results
  const handleToggleReady = () => {
    const nextReady = !isReadyForNextRound;
    setIsReadyForNextRound(nextReady);
    roomBus.broadcastPlayerReadyUpdate(roomCode, playerId, nextReady, playerName);
  };

  // Handle Return to Lobby
  const handleReturnToLobby = () => {
    roomBus.broadcastReturnToLobby(roomCode);
    setGuideState((prev) => ({
      ...prev,
      phase: 'LOBBY',
    }));
  };

  // 1. Lobby Phase
  if (guideState.phase === 'LOBBY') {
    return (
      <UnifiedShabahLobby
        roomCode={roomCode}
        gameId="ai-guide"
        gameTitle="الشبح المرشد"
        role="contestant"
        currentPlayerId={playerId}
        onExit={() => {
          roomBus.leavePlayer(roomCode, playerId);
          navigate('/');
        }}
      />
    );
  }

  // 2. Intro Stage (Mobile waiting screen)
  if (guideState.phase === 'INTRO') {
    return (
      <div
        dir="rtl"
        className="flex-1 w-full min-h-screen bg-[#000000] text-white flex flex-col items-center justify-center p-6 text-center select-none"
      >
        <div className="relative mb-6">
          <div className="p-1 rounded-full bg-gradient-to-tr from-[#B56BFF] via-[#38BDF8] to-[#4ADE80] shadow-[0_0_40px_rgba(56,189,248,0.4)] animate-pulse">
            <div className="w-28 h-28 rounded-full bg-[#0A0A0A] flex items-center justify-center">
              <Compass className="w-14 h-14 text-emerald-400 animate-spin" />
            </div>
          </div>
        </div>

        <h2 className="font-sans font-black text-2xl text-white mb-2">
          الشبح المرشد ينطلق نحو وجهة سرية!
        </h2>
        <p className="font-sans text-xs sm:text-sm text-zinc-400 max-w-xs leading-relaxed mb-6">
          تابع شاشة التلفزيون لمشاهدة رحلة الشبح... وكن مستعداً لوضع دبوسك وقراءة التلميحات!
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-sans">
          <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>تبدأ الجولة بعد ثوانٍ قليلة...</span>
        </div>
      </div>
    );
  }

  // 3. Guessing & Pinning Phase (Mobile Interactive Map)
  if (guideState.phase === 'GUESSING') {
    const currentClue = guideState.currentLandmark?.clues[guideState.activeClueIndex] || '';

    return (
      <GuideMobileView
        roomCode={roomCode}
        roundNumber={guideState.roundNumber}
        totalRounds={guideState.totalRounds}
        timerSeconds={guideState.timerSeconds}
        activeClueText={currentClue}
        activeClueIndex={guideState.activeClueIndex}
        hasSubmitted={hasSubmittedThisRound}
        onLockPin={handleLockPin}
        onReturnToLobby={handleReturnToLobby}
      />
    );
  }

  // 4. Results Phase
  if (guideState.phase === 'RESULTS') {
    const connectedCount = Math.max(1, activeRoom?.players?.length || 1);

    return (
      <GuideResultsStage
        isTV={false}
        landmark={guideState.currentLandmark}
        roundNumber={guideState.roundNumber}
        totalRounds={guideState.totalRounds}
        results={guideState.results || {}}
        cumulativeScores={guideState.cumulativeScores || {}}
        onReturnToLobby={handleReturnToLobby}
        isReadyForNextRound={isReadyForNextRound}
        onToggleReady={handleToggleReady}
        readyCount={guideState.readyPlayersNextRound?.length || 0}
        totalConnectedCount={connectedCount}
        currentContestantId={playerId}
      />
    );
  }

  // 5. Final Podium Phase
  const ranked = getRankedGuideContestants(
    guideState.cumulativeScores || {},
    activeRoom?.players || [{ id: playerId, name: playerName }],
    guideState.biggestMisses || {}
  );

  return (
    <GuideFinalPodium
      isTV={false}
      rankedContestants={ranked}
      onReturnToLobby={handleReturnToLobby}
    />
  );
};

export default GuideMobileRoot;
