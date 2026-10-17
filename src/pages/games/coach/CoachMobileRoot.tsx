import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom, roomBus } from '../../../lib/roomBus';
import {
  CoachGameMode,
  CoachRoomState,
  CoachSlotKey,
  CoachPlayerPick,
  ClaimedPlayerInfo,
} from './types';
import {
  createInitialCoachState,
  savePersistedCoachState,
  generateBingoCard,
} from './coachSync';
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
        const next = {
          ...prev,
          phase: 'LOBBY' as CoachGamePhase,
          roundNumber: 1,
          timerSeconds: 45,
          claimedPlayers: {},
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
      unsubClaimed();
      unsubMode();
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
      roomBus.emit('COACH_STATE_SYNC', roomCode, next);
      return next;
    });
  };

  const handleStartGame = () => {
    sound.playSuccess();
    if (coachState.mode === 'draft') {
      const nextState: CoachRoomState = {
        ...coachState,
        phase: 'DRAFTING',
        roundNumber: 1,
        activeConditionId: 'c_bald',
        activeConditionTitle: 'لاعب أصلع تماماً',
        claimedPlayers: {},
        squads: {},
        verdict: null,
      };
      setCoachState(nextState);
      savePersistedCoachState(roomCode, nextState);
      roomBus.emit('COACH_STATE_SYNC', roomCode, nextState);
    } else {
      const firstPlayer = getRandomRoulettePlayer();
      const cards: Record<string, BingoCard> = {
        [playerId]: generateBingoCard(playerId),
      };
      const nextState: CoachRoomState = {
        ...coachState,
        phase: 'BINGO_PLAYING',
        currentRoulettePlayer: firstPlayer,
        rouletteHistory: [firstPlayer.id],
        bingoCards: cards,
        bingoWinnerId: null,
        bingoWinnerName: null,
      };
      setCoachState(nextState);
      savePersistedCoachState(roomCode, nextState);
      roomBus.emit('COACH_STATE_SYNC', roomCode, nextState);
    }
  };

  const handleExit = () => {
    sound.playClick();
    roomBus.leavePlayer(roomCode, playerId);
    navigate('/');
  };

  const handleConfirmPick = (slotKey: CoachSlotKey, pick: CoachPlayerPick) => {
    // Emit pick to TV Host and other peers
    roomBus.emit('COACH_PICK_SUBMITTED', roomCode, {
      playerId,
      playerName,
      slotKey,
      pick,
    });

    // Update local state optimistically
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

  const handleToggleBingoCell = (cellIndex: number) => {
    roomBus.emit('BINGO_CELL_MARKED', roomCode, {
      playerId,
      cellIndex,
    });

    // Optimistic update
    setCoachState((prev) => {
      const card = prev.bingoCards[playerId];
      if (!card) return prev;

      const cells = [...card.cells];
      if (cells[cellIndex]) {
        cells[cellIndex].isMarked = !cells[cellIndex].isMarked;
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

  const handleClaimBingo = () => {
    roomBus.emit('BINGO_CLAIMED', roomCode, {
      playerId,
      playerName,
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

  if (coachState.phase === 'LOBBY') {
    return (
      <CoachLobby
        roomCode={roomCode}
        role="contestant"
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
      className="min-h-screen w-full bg-[#000000] text-[#FFFFFF] flex flex-col justify-between selection:bg-white selection:text-black overflow-x-hidden"
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
            : 'اختر لاعباً يحقق شرط الجولة ولم يختره غيرك!'
        }
        isHost={false}
        onExit={handleExit}
      />

      <main className="w-full flex-1 flex flex-col items-center justify-start py-2">
        {coachState.mode === 'draft' ? (
          <CoachDraftMobileView
            contestantId={playerId}
            contestantName={playerName}
            squad={mySquad}
            roundNumber={coachState.roundNumber}
            conditionTitle={coachState.activeConditionTitle || 'شرط تكتيكي'}
            conditionId={coachState.activeConditionId || 'c_default'}
            claimedPlayers={coachState.claimedPlayers}
            onConfirmPick={handleConfirmPick}
            evaluationResult={myEvaluation}
          />
        ) : (
          <CoachBingoMobileView
            card={myBingoCard}
            currentRoulettePlayer={coachState.currentRoulettePlayer || null}
            onToggleCell={handleToggleBingoCell}
            onClaimBingo={handleClaimBingo}
            winnerName={coachState.bingoWinnerName}
          />
        )}
      </main>
    </div>
  );
};
