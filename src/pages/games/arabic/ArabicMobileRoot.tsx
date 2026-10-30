import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom, roomBus } from '../../../lib/roomBus';
import { useRoomSync } from '../../../hooks/useRoomSync';
import { sound } from '../../../lib/audio';
import { UnifiedShabahLobby } from '../../../components/lobby/UnifiedShabahLobby';
import { ArabicRoomState, ObjectionState, PlayerArabicEvaluation } from './types';
import { createInitialArabicState, getRankedContestants } from './arabicSync';
import {
  getOrCreatePlayerId,
  getOrCreatePlayerName,
  getPersistedPlayerName,
} from '../../../utils/playerSession';
import { ArabicRouletteStage } from './components/ArabicRouletteStage';
import { ArabicMobileInput } from './components/ArabicMobileInput';
import { ArabicMobileResults } from './components/ArabicMobileResults';
import { ArabicFinalPodium } from './components/ArabicFinalPodium';
import { Clock } from 'lucide-react';

export const ArabicMobileRoot: React.FC = () => {
  const { code: rawCode } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const roomCode = (rawCode || 'SHBH').trim().toUpperCase();

  const [playerId] = useState<string>(() => getOrCreatePlayerId());
  const [playerName] = useState<string>(() => {
    return getPersistedPlayerName() || getOrCreatePlayerName('متسابق');
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

  const [arabicState, setArabicState] = useState<ArabicRoomState>(() =>
    createInitialArabicState(roomCode)
  );

  const [hasSubmittedThisRound, setHasSubmittedThisRound] = useState<boolean>(false);
  const [isReadyForNextRound, setIsReadyForNextRound] = useState<boolean>(false);

  // Synchronize with TV host state
  useEffect(() => {
    const unsubSync = roomBus.on('ARABIC_STATE_SYNC', (evt: any) => {
      const incomingCode = evt?.roomCode;
      const payload = evt?.data ?? evt;
      if (incomingCode && incomingCode !== roomCode) return;
      if (!payload) return;
      setArabicState(payload);

      // Reset submission flag when a new round starts
      if (payload.phase === 'ROULETTE' || payload.phase === 'INPUT') {
        setIsReadyForNextRound(false);
      }
      if (payload.phase === 'ROULETTE') {
        setHasSubmittedThisRound(false);
      }
    });

    const unsubResults = roomBus.on('ARABIC_RESULTS_READY', (evt: any) => {
      const incomingCode = evt?.roomCode;
      const payload = evt?.data ?? evt;
      if (incomingCode && incomingCode !== roomCode) return;
      if (!payload?.evaluations) return;

      const playerEvals: PlayerArabicEvaluation[] = payload.evaluations;
      const legacyMap: Record<string, any> = {};

      playerEvals.forEach((pe) => {
        legacyMap[pe.playerId] = {
          contestantId: pe.playerId,
          contestantName: pe.playerName,
          totalRoundPoints: pe.totalScore,
          roundPoints: pe.totalScore,
          speedBonus: 0,
          answers: pe.results.map((r, idx) => ({
            categoryIndex: idx,
            categoryName: r.category,
            rawAnswer: r.answer,
            isValid: r.isCorrect,
            isUnique: r.score === 10,
            points: r.score,
            comment: r.reason,
          })),
        };
      });

      setArabicState((prev) => ({
        ...prev,
        phase: 'RESULTS',
        playerEvaluations: playerEvals,
        evaluations: legacyMap,
      }));
    });

    const unsubResolved = roomBus.on('ARABIC_OBJECTION_RESOLVED', (evt: any) => {
      const incomingCode = evt?.roomCode;
      const payload = evt?.data ?? evt;
      if (incomingCode && incomingCode !== roomCode) return;
      if (!payload) return;

      if (payload.isOverturned) {
        sound.playVictory();
      } else {
        sound.playIncorrect?.();
      }
    });

    const unsubLobby = roomBus.on('RETURN_TO_LOBBY', (evt: any) => {
      const incomingCode = evt?.roomCode;
      if (incomingCode && incomingCode !== roomCode) return;
      setArabicState((prev) => ({
        ...prev,
        phase: 'LOBBY',
      }));
      setHasSubmittedThisRound(false);
      setIsReadyForNextRound(false);
    });

    return () => {
      unsubSync?.();
      unsubResults?.();
      unsubResolved?.();
      unsubLobby?.();
    };
  }, [roomCode]);

  // Handle Answer Submission
  const handleSubmitAnswers = (answers: Record<number, string>, durationMs: number) => {
    setHasSubmittedThisRound(true);
    sound.playClick();

    const payload = {
      contestantId: playerId,
      contestantName: playerName,
      playerId,
      playerName,
      answers,
      finishedAt: Date.now(),
      durationMs,
    };

    roomBus.broadcastArabicAnswers(roomCode, payload);
    // Also emit SUBMIT_ARABIC_ANSWERS for compatibility
    roomBus.safeBroadcast(roomCode, 'SUBMIT_ARABIC_ANSWERS', payload);
  };

  // Handle Objection Filing
  const handleFileObjection = (categoryIndex: number, answer: string) => {
    sound.playClick();
    const categoryName = arabicState.currentCategories[categoryIndex] || '';
    const payload = {
      contestantId: playerId,
      contestantName: playerName,
      category: categoryName,
      categoryIndex,
      answer,
    };
    roomBus.broadcastArabicObjection(roomCode, payload);
    roomBus.safeBroadcast(roomCode, 'ARABIC_OBJECTION_RAISED', payload);
  };

  // Handle Objection Vote
  const handleVoteObjection = (objectionId: string, voteFor: boolean) => {
    sound.playClick();
    roomBus.broadcastArabicVote(roomCode, {
      contestantId: playerId,
      objectionId,
      voteFor,
    });
  };

  // Handle Ready Toggle
  const handleToggleReady = () => {
    const nextReady = !isReadyForNextRound;
    setIsReadyForNextRound(nextReady);
    roomBus.broadcastPlayerReadyUpdate(roomCode, playerId, nextReady, playerName);
  };

  // Handle Return to Lobby
  const handleReturnToLobby = () => {
    roomBus.broadcastReturnToLobby(roomCode);
    setArabicState((prev) => ({
      ...prev,
      phase: 'LOBBY',
    }));
  };

  // 1. Lobby Phase
  if (arabicState.phase === 'LOBBY') {
    return (
      <UnifiedShabahLobby
        roomCode={roomCode}
        gameId="ai-arabic"
        gameTitle="الشبح العربي"
        role="contestant"
        currentPlayerId={playerId}
        onExit={() => {
          roomBus.leavePlayer(roomCode, playerId);
          navigate('/');
        }}
      />
    );
  }

  // 2. Roulette Phase
  if (arabicState.phase === 'ROULETTE') {
    return (
      <ArabicRouletteStage
        targetLetter={arabicState.currentLetter}
        roundNumber={arabicState.roundNumber}
        totalRounds={arabicState.totalRounds}
        isTV={false}
      />
    );
  }

  // 3. Dedicated Correction Waiting Screen (JUDGING)
  if (arabicState.phase === 'JUDGING') {
    return (
      <div
        dir="rtl"
        className="flex-1 w-full flex flex-col items-center justify-between p-6 bg-black text-white text-center select-none"
      >
        <div className="w-full flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="text-xs font-sans text-zinc-400">
            الغرفة: <span className="font-bold text-white tracking-widest">{roomCode}</span>
          </div>
          <button
            onClick={handleReturnToLobby}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-sans text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            العودة للوبي
          </button>
        </div>

        <div className="my-auto flex flex-col items-center justify-center">
          <div className="relative mb-6">
            <div className="p-1 rounded-full bg-gradient-to-tr from-[#B56BFF] via-[#38BDF8] to-[#4ADE80] shadow-[0_0_40px_rgba(56,189,248,0.4)] animate-pulse">
              <div className="w-28 h-28 rounded-full bg-[#0A0A0A] flex items-center justify-center">
                <span className="font-sans font-black text-5xl text-emerald-400">
                  {arabicState.currentLetter}
                </span>
              </div>
            </div>
          </div>

          <h2 className="font-sans font-bold text-xl sm:text-2xl text-white mb-2">
            الشبح العربي يدقق القواميس والمعاجم...
          </h2>
          <p className="font-sans text-xs sm:text-sm text-zinc-400 max-w-xs leading-relaxed mb-6">
            فحص دقيق لكلمات المتسابقين بحرف ({arabicState.currentLetter}) واكتشاف الإجابات المكررة والفريدة.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-sans">
            <Clock className="w-4 h-4 text-emerald-400 animate-spin" />
            <span>إصدار النتائج وتوزيع النقاط قيد التنفيذ...</span>
          </div>
        </div>

        <div className="w-full text-center text-[11px] font-sans text-zinc-600">
          منظومة شبح التحكيمية
        </div>
      </div>
    );
  }

  // 4. Solving Phase (Mobile Input)
  if (arabicState.phase === 'INPUT') {
    return (
      <ArabicMobileInput
        contestantId={playerId}
        contestantName={playerName}
        currentLetter={arabicState.currentLetter}
        categories={arabicState.currentCategories}
        timerSeconds={arabicState.timerSeconds}
        hasSubmitted={hasSubmittedThisRound}
        onSubmit={handleSubmitAnswers}
        roundStartTime={arabicState.roundStartedAt}
      />
    );
  }

  // 5. Results & Objection Phase
  if (arabicState.phase === 'RESULTS') {
    const connectedContestantsCount = Math.max(1, activeRoom?.players?.length || 1);

    return (
      <ArabicMobileResults
        currentContestantId={playerId}
        evaluations={arabicState.evaluations || {}}
        categories={arabicState.currentCategories || []}
        currentLetter={arabicState.currentLetter}
        activeObjection={arabicState.activeObjection}
        onFileObjection={handleFileObjection}
        onVoteObjection={handleVoteObjection}
        isReadyForNextRound={isReadyForNextRound}
        onToggleReady={handleToggleReady}
        readyContestantsCount={arabicState.readyPlayersNextRound?.length || 0}
        totalContestantsCount={connectedContestantsCount}
        onReturnToLobby={handleReturnToLobby}
      />
    );
  }

  // 5. Final Podium Phase
  const ranked = getRankedContestants(
    arabicState.cumulativeScores || {},
    activeRoom?.players || [{ id: playerId, name: playerName }]
  );

  return (
    <ArabicFinalPodium
      rankedContestants={ranked}
      isTV={false}
      onReturnToLobby={handleReturnToLobby}
    />
  );
};

export default ArabicMobileRoot;
