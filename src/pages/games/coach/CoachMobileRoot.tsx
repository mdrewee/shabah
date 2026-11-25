import { useConfirmation } from '../../../components/common/ConfirmationProvider';
import { ShabahThinkingScreen } from '../../../components/common/ShabahThinkingScreen';
import { isRoomHost } from '../../../services/roomService';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom, roomBus } from '../../../lib/roomBus';
import {
  CoachGameMode,
  CoachRoomState,
  CoachSlotKey,
  CoachPlayerPick,
  ClaimedPlayerInfo,
  COACH_SLOTS_ORDER,
} from './types';
import {
  createInitialCoachState,
  savePersistedCoachState,
  generateBingoCard,
} from './coachSync';
import { normalizeFootballSearch } from './footballDataService';
import { CoachLobby } from './CoachLobby';
import { CoachTopBar } from './components/CoachTopBar';
import { CoachDraftMobileView } from './components/CoachDraftMobileView';
import { CoachBingoMobileView } from './components/CoachBingoMobileView';
import { sound } from '../../../lib/audio';
import {
  getOrCreatePlayerId,
  getOrCreatePlayerName,
  getPersistedPlayerName,
} from '../../../utils/playerSession';
import { useRoomSync } from '../../../hooks/useRoomSync';

export const CoachMobileRoot: React.FC = () => {
  const { code: rawCode } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const roomCode = (rawCode || 'SHBH').trim().toUpperCase();
  const confirm = useConfirmation();
  const isPlayerHost = isRoomHost(roomCode);

  const [playerId] = useState(() => getOrCreatePlayerId());
  const [playerName] = useState(() => getPersistedPlayerName() || getOrCreatePlayerName('متسابق'));

  // Maintain continuous presence across all Coach game phases
  useRoomSync({
    roomCode,
    role: 'contestant',
    playerId,
    playerName,
  });

  const [coachState, setCoachState] = useState<CoachRoomState>(() =>
    createInitialCoachState(roomCode, 'draft')
  );

  // Sync state from server / host
  useEffect(() => {
    const unsubSync = roomBus.on('COACH_STATE_SYNC', (evt: any) => {
      const payload = evt?.data || evt;
      if (payload && payload.roomCode === roomCode) {
        setCoachState(payload);
        savePersistedCoachState(roomCode, payload);
      }
    }, roomCode);

    const unsubClaimSuccess = roomBus.on('PLAYER_CLAIM_SUCCESS', (evt: any) => {
      const payload = evt?.data || evt;
      if (payload && payload.pick) {
        sound.playSuccess?.();
        setCoachState((prev) => {
          if(payload.roundNumber!==prev.roundNumber || prev.mode!=='draft')return prev;
          const norm = normalizeFootballSearch(payload.player.name || payload.player.playerName || payload.pick.playerName);
          const updatedClaims = {
            ...prev.claimedPlayers,
            [norm]: {
              normalizedName: norm,
              originalName: payload.player.name || payload.player.playerName || payload.pick.playerName,
              contestantId: payload.contestantId,
              contestantName: payload.contestantName,
              timestamp: Date.now(),
            },
          };

          const pSquad = prev.squads[payload.contestantId] || {
            playerId: payload.contestantId,
            playerName: payload.contestantName,
            slots: {},
          };

          const targetSlot = (payload.slotKey as CoachSlotKey) || COACH_SLOTS_ORDER[(prev.roundNumber || 1) - 1] || 'FWD';

          const updatedSquads = {
            ...prev.squads,
            [payload.contestantId]: {
              ...pSquad,
              slots: {
                ...pSquad.slots,
                [targetSlot]: payload.pick,
              },
            },
          };

          return {
            ...prev,
            claimedPlayers: updatedClaims,
            squads: updatedSquads,
            currentRoundSelections: {
              ...(prev.currentRoundSelections || {}),
              [payload.contestantId]: payload.pick,
            },
          };
        });
      }
    });

    const unsubClaimed = roomBus.on('PLAYER_CLAIMED', (evt: any) => {
      const payload = (evt?.data || evt) as ClaimedPlayerInfo;
      if (payload && payload.normalizedName) {
        setCoachState((prev) => ({
          ...prev,
          claimedPlayers: {
            ...prev.claimedPlayers,
            [payload.normalizedName]: payload,
          },
        }));
      }
    });

    const unsubMode = roomBus.on('COACH_MODE_SELECTED', (evt: any) => {
      const payload = evt?.data || evt;
      if (payload && payload.mode) {
        setCoachState((prev) => {
          const next = { ...prev, mode: payload.mode };
          savePersistedCoachState(roomCode, next);
          return next;
        });
      }
    });

    const unsubBingoPlayer = roomBus.on('BINGO_PLAYER_SELECTED', (evt: any) => {
      const player = evt?.data || evt;
      if (player && player.id) {
        sound.playRouletteTick();
        setCoachState((prev) => ({
          ...prev,
          currentRoulettePlayer: player,
        }));
      }
    });

    const unsubReturn = roomBus.on('RETURN_TO_LOBBY', () => {
      sound.playClick();
      setCoachState((prev) => {
        const next: CoachRoomState = {
          ...prev,
          phase: 'LOBBY',
          roundNumber: 1,
          totalRounds: 5,
          slotIndex: 0,
          claimedPlayers: {},
          usedPlayersAcrossMatch: [],
          readyPlayersNextRound: [],
          cumulativeScores: {},
          squads: {},
          verdict: null,
          bingoWinnerId: null,
          bingoWinnerName: null,
        };
        savePersistedCoachState(roomCode, next);
        return next;
      });
    });

    return () => {
      unsubSync();
      unsubClaimSuccess();
      unsubClaimed();
      unsubMode();
      unsubBingoPlayer();
      unsubReturn();
    };
  }, [roomCode, navigate]);

  useEffect(() => {
    roomBus.emit('REQUEST_ROOM_STATE', roomCode, {});
  }, [roomCode]);

  const handleSelectMode = (mode: CoachGameMode) => {
    sound.playClick();
    const next = { ...coachState, mode };
    setCoachState(next);
    savePersistedCoachState(roomCode, next);
    roomBus.emit('COACH_MODE_SELECTED', roomCode, { mode });
    roomBus.broadcastCoachSync(roomCode, next);
  };

  const handleExit = async () => {
    if (isPlayerHost) {
      if (!await confirm('تنهي الغرفة وتخرج جميع اللاعبين؟')) return;
      if (await roomBus.terminateRoom(roomCode)) navigate('/');
      return;
    }
    sound.playClick();
    roomBus.leavePlayer(roomCode, playerId);
    navigate('/');
  };

  const handleToggleBingoCell = (cellIndex: number, playerPhoto?: string, playerNameParam?: string) => {
    roomBus.emit('BINGO_CELL_MARKED', roomCode, {
      playerId,
      playerName: playerNameParam || playerName,
      cellIndex,
      playerPhoto,
      roulettePlayerId: coachState.currentRoulettePlayer?.id,
      rouletteTurn: coachState.rouletteHistory.length,
    });
  };

  const handleSkipBingoPlayer = () => {
    roomBus.emit('BINGO_PLAYER_SKIPPED', roomCode, {
      playerId,
      roulettePlayerId: coachState.currentRoulettePlayer?.id,
      rouletteTurn: coachState.rouletteHistory.length,
    });
  };

  const handleClaimBingo = () => {
    roomBus.emit('BINGO_CLAIMED', roomCode, {
      playerId,
      playerName,
    });
  };

  const handleToggleReadyForNextRound = () => {
    roomBus.emit('COACH_ROUND_READY', roomCode, {
      playerId,
    });
  };

  const mySquad = coachState.squads[playerId] || {
    playerId,
    playerName,
    slots: {},
  };

  const myBingoCard =
    coachState.bingoCards[playerId] || generateBingoCard(playerId);

  const myEvaluation = coachState.verdict?.evaluations.find((e) => e.playerId === playerId);
  const isMeReadyForNext = Boolean(coachState.readyPlayersNextRound?.includes(playerId));

  if (coachState.phase === 'EVALUATING') return <ShabahThinkingScreen title="الشبح يراجع التشكيلات"
    onRetry={isPlayerHost ? () => window.location.reload() : undefined}
    onReturnToLobby={isPlayerHost ? () => roomBus.broadcastReturnToLobby(roomCode) : undefined} />;

  if (coachState.phase === 'LOBBY') {
    return (
      <CoachLobby
        roomCode={roomCode}
        role="contestant"
        isPlayerHost={isPlayerHost}
        selectedMode={coachState.mode}
        onSelectMode={handleSelectMode}
        currentPlayerId={playerId}
        onExit={handleExit}
      />
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full bg-[#000000] text-[#FFFFFF] flex flex-col justify-between selection:bg-white selection:text-black overflow-x-hidden font-sans"
    >
      <CoachTopBar
        roomCode={roomCode}
        mode={coachState.mode}
        roundNumber={coachState.roundNumber}
        mood={myEvaluation ? 'happy' : 'judging'}
        remark={
          coachState.phase === 'VERDICT'
            ? myEvaluation?.critique || 'انتهى التقييم! راجع نتيجتك التكتيكية.'
            : coachState.phase === 'BINGO_PLAYING'
            ? 'طابق اللاعب الحالي مع الخانات المتوفرة ببطاقتك!'
            : `جولة ${coachState.roundNumber} من ٥ • اختر لاعبك التكتيكي بدون ما تكرر لاعب غيرك!`
        }
        isHost={isPlayerHost}
        onReturnToLobby={() => roomBus.broadcastReturnToLobby(roomCode)}
        onExit={handleExit}
      />

      <main className="w-full flex-1 flex flex-col items-center justify-start py-2">
        {coachState.mode === 'draft' ? (
          <CoachDraftMobileView
            roomCode={roomCode}
            contestantId={playerId}
            contestantName={playerName}
            squad={mySquad}
            roundNumber={coachState.roundNumber}
            totalRounds={coachState.totalRounds || 5}
            conditionTitle={coachState.activeConditionTitle || 'شرط تكتيكي'}
            conditionId={coachState.activeConditionId || 'c_default'}
            conditionDescription={coachState.activeConditionDescription}
            claimedPlayers={coachState.claimedPlayers}
            currentRoundSelections={coachState.currentRoundSelections || {}}
            usedPlayersAcrossMatch={coachState.usedPlayersAcrossMatch || []}
            isReadyForNextRound={isMeReadyForNext}
            onReadyForNextRound={handleToggleReadyForNextRound}
            evaluationResult={myEvaluation}
            verificationMode={coachState.verdict?.verificationMode}
            onRetryEvaluation={isPlayerHost?()=>roomBus.emit('COACH_MODE_SELECTED',roomCode,{action:'retryDraft'}):undefined}
            isMyTurn={true}
            turnSecondsRemaining={coachState.turnSecondsRemaining}
          />
        ) : (
          <CoachBingoMobileView
            card={myBingoCard}
            currentRoulettePlayer={coachState.currentRoulettePlayer || null}
            hasAttempted={coachState.rouletteSkipVotes.includes(playerId)}
            turnKey={`${coachState.rouletteHistory.length}:${coachState.currentRoulettePlayer?.id}`}
            endsAt={coachState.rouletteEndsAt}
            onToggleCell={handleToggleBingoCell}
            onSkipPlayer={handleSkipBingoPlayer}
            onClaimBingo={handleClaimBingo}
            winnerName={coachState.bingoWinnerName}
            isReadyForNextRound={isMeReadyForNext}
            onReadyForNextRound={handleToggleReadyForNextRound}
          />
        )}
      </main>
    </div>
  );
};
