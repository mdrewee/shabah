import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
import { getRandomMatchCriteria } from '../../../data/coachCriteria';
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomCode = (rawCode || 'SHBH').trim().toUpperCase();
  const isPlayerHost = searchParams.get('host') === '1';

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
    });

    const unsubClaimSuccess = roomBus.on('PLAYER_CLAIM_SUCCESS', (evt: any) => {
      const payload = evt?.data || evt;
      if (payload && payload.pick) {
        sound.playSuccess?.();
        setCoachState((prev) => {
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

    const unsubTerminated = roomBus.on('ROOM_TERMINATED', () => {
      sound.playTick();
      navigate('/');
    });

    const unsubClosed = roomBus.on('ROOM_CLOSED', () => {
      sound.playTick();
      navigate('/');
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
      unsubTerminated();
      unsubClosed();
      unsubReturn();
    };
  }, [roomCode, navigate]);

  const handleSelectMode = (mode: CoachGameMode) => {
    sound.playClick();
    setCoachState((prev) => {
      const next = { ...prev, mode };
      savePersistedCoachState(roomCode, next);
      roomBus.emit('COACH_MODE_SELECTED', roomCode, { mode });
      roomBus.broadcastCoachSync(roomCode, next);
      return next;
    });
  };

  const handleStartGame = () => {
    sound.playSuccess();
    if (coachState.mode === 'draft') {
      const matchCriteria = getRandomMatchCriteria(5);
      const firstCrit = matchCriteria[0];
      const nextState: CoachRoomState = {
        ...coachState,
        phase: 'DRAFTING',
        roundNumber: 1,
        totalRounds: 5,
        slotIndex: 0,
        matchCriteria,
        activeConditionId: firstCrit.id,
        activeConditionTitle: firstCrit.title,
        activeConditionDescription: firstCrit.description,
        claimedPlayers: {},
        currentRoundSelections: {},
        usedPlayersAcrossMatch: [],
        readyPlayersNextRound: [],
        cumulativeScores: {},
        squads: {},
        verdict: null,
      };
      setCoachState(nextState);
      savePersistedCoachState(roomCode, nextState);
      roomBus.broadcastCoachSync(roomCode, nextState);
    } else {
      const cards: Record<string, any> = {
        [playerId]: generateBingoCard(playerId),
      };
      const nextState: CoachRoomState = {
        ...coachState,
        phase: 'BINGO_PLAYING',
        rouletteHistory: [],
        rouletteSkipVotes: [],
        bingoCards: cards,
        readyPlayersNextRound: [],
        bingoWinnerId: null,
        bingoWinnerName: null,
      };
      setCoachState(nextState);
      savePersistedCoachState(roomCode, nextState);
      roomBus.broadcastCoachSync(roomCode, nextState);
    }
  };

  const handleExit = () => {
    sound.playClick();
    roomBus.leavePlayer(roomCode, playerId);
    navigate('/');
  };

  const handleConfirmPick = (slotKey: CoachSlotKey, pick: CoachPlayerPick) => {
    roomBus.broadcastCoachPick(roomCode, {
      playerId,
      playerName,
      slotKey,
      pick,
      roomCode,
    });

    setCoachState((prev) => {
      const existingSquad = prev.squads[playerId] || {
        playerId,
        playerName,
        slots: {},
      };

      const updated = {
        ...prev,
        squads: {
          ...prev.squads,
          [playerId]: {
            ...existingSquad,
            slots: {
              ...existingSquad.slots,
              [slotKey]: pick,
            },
          },
        },
      };

      savePersistedCoachState(roomCode, updated);
      return updated;
    });
  };

  const handleToggleBingoCell = (cellIndex: number, playerPhoto?: string, playerNameParam?: string) => {
    roomBus.emit('BINGO_CELL_MARKED', roomCode, {
      playerId,
      playerName: playerNameParam || playerName,
      cellIndex,
      playerPhoto,
    });

    setCoachState((prev) => {
      const card = prev.bingoCards[playerId];
      if (!card) return prev;

      const cells = [...card.cells];
      if (cells[cellIndex]) {
        cells[cellIndex] = {
          ...cells[cellIndex],
          isMarked: true,
          markedPlayerPhoto: playerPhoto,
          markedPlayerName: playerNameParam || playerName,
        };
      }

      return {
        ...prev,
        bingoCards: {
          ...prev.bingoCards,
          [playerId]: {
            ...card,
            cells,
          },
        },
      };
    });
  };

  const handleSkipBingoPlayer = () => {
    roomBus.emit('BINGO_PLAYER_SKIPPED', roomCode, {
      playerId,
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

  if (coachState.phase === 'LOBBY') {
    return (
      <CoachLobby
        roomCode={roomCode}
        role="contestant"
        isPlayerHost={isPlayerHost}
        selectedMode={coachState.mode}
        onSelectMode={handleSelectMode}
        onStartGame={handleStartGame}
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
        conditionTitle={coachState.phase === 'DRAFTING' ? coachState.activeConditionTitle : undefined}
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
            onConfirmPick={handleConfirmPick}
            evaluationResult={myEvaluation}
            isMyTurn={true}
            turnSecondsRemaining={coachState.turnSecondsRemaining}
          />
        ) : (
          <CoachBingoMobileView
            card={myBingoCard}
            currentRoulettePlayer={coachState.currentRoulettePlayer || null}
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
