import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom, roomBus } from '../../../lib/roomBus';
import {
  CoachGameMode,
  CoachGamePhase,
  CoachRoomState,
  CoachSquad,
  CoachSlotKey,
  CoachPlayerPick,
  ClaimedPlayerInfo,
  CoachVerdict,
  BingoCard,
  BingoRoulettePlayer,
  COACH_SLOTS_ORDER,
} from './types';
import {
  createInitialCoachState,
  savePersistedCoachState,
  generateBingoCard,
  getRandomRoulettePlayer,
} from './coachSync';
import { evaluateAllSquads, evaluateAllSquadsWithAI } from './coachEvaluationEngine';
import { normalizeFootballSearch } from './footballDataService';
import { DRAFT_CONDITIONS_BANK, getRandomDraftCondition } from '../../../data/draftConditions';
import { CoachLobby } from './CoachLobby';
import { CoachTopBar } from './components/CoachTopBar';
import { CoachDraftTVView } from './components/CoachDraftTVView';
import { CoachBingoTVView } from './components/CoachBingoTVView';
import { sound } from '../../../lib/audio';

export const CoachTVRoot: React.FC = () => {
  const { code: rawCode } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const roomCode = (rawCode || 'SHBH').trim().toUpperCase();

  const { room } = useRoom(roomCode);
  const activeRoom = room || roomBus.getRoom(roomCode);

  // Synchronized Coach State
  const [coachState, setCoachState] = useState<CoachRoomState>(() =>
    createInitialCoachState(roomCode, 'draft')
  );

  const coachStateRef = useRef<CoachRoomState>(coachState);
  useEffect(() => {
    coachStateRef.current = coachState;
    savePersistedCoachState(roomCode, coachState);
  }, [coachState, roomCode]);

  // Round Timer
  const [timerSeconds, setTimerSeconds] = useState(45);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Active condition for draft mode
  const [currentCondition, setCurrentCondition] = useState(() => DRAFT_CONDITIONS_BANK[0]);

  // Connected contestants (max 10)
  const contestants = (activeRoom?.players || [])
    .slice(0, 10)
    .map((p) => ({ id: p.id, name: p.name || 'متسابق' }));

  // Listen to remote room events
  useEffect(() => {
    const unsubPick = roomBus.on('COACH_PICK_SUBMITTED', (evt: any) => {
      const payload = evt?.data || evt;
      if (!payload || !payload.playerId) return;

      const { playerId, playerName, slotKey, pick } = payload;

      setCoachState((prev) => {
        const norm = normalizeFootballSearch(pick.playerName);
        const updatedClaims = {
          ...prev.claimedPlayers,
          [norm]: {
            normalizedName: norm,
            originalName: pick.playerName,
            contestantId: playerId,
            contestantName: playerName,
            timestamp: Date.now(),
          },
        };

        const existingSquad = prev.squads[playerId] || {
          playerId,
          playerName,
          slots: {},
        };

        const updatedSquads = {
          ...prev.squads,
          [playerId]: {
            ...existingSquad,
            slots: {
              ...existingSquad.slots,
              [slotKey]: pick,
            },
          },
        };

        const nextState = {
          ...prev,
          claimedPlayers: updatedClaims,
          squads: updatedSquads,
        };

        // Broadcast to all devices
        roomBus.emit('PLAYER_CLAIMED', roomCode, updatedClaims[norm]);
        roomBus.emit('COACH_STATE_SYNC', roomCode, nextState);
        return nextState;
      });

      sound.playSuccess();
      setStatusBanner(`${playerName} خطف ${pick.playerName} في ${slotKey === 'FWD' ? 'الهجوم' : slotKey === 'GK' ? 'الحراسة' : slotKey === 'MID' ? 'الوسط' : 'الدفاع'}!`);

      window.setTimeout(() => setStatusBanner(null), 4000);
    });

    const unsubBingoMark = roomBus.on('BINGO_CELL_MARKED', (evt: any) => {
      const payload = evt?.data || evt;
      if (!payload || !payload.playerId) return;

      setCoachState((prev) => {
        const card = prev.bingoCards[payload.playerId];
        if (!card) return prev;

        const updatedCells = [...card.cells];
        if (updatedCells[payload.cellIndex]) {
          updatedCells[payload.cellIndex].isMarked = !updatedCells[payload.cellIndex].isMarked;
        }

        const nextState = {
          ...prev,
          bingoCards: {
            ...prev.bingoCards,
            [payload.playerId]: {
              ...card,
              cells: updatedCells,
            },
          },
        };

        roomBus.emit('COACH_STATE_SYNC', roomCode, nextState);
        return nextState;
      });
    });

    const unsubBingoClaim = roomBus.on('BINGO_CLAIMED', (evt: any) => {
      const payload = evt?.data || evt;
      if (!payload || !payload.playerId) return;

      sound.playSuccess();
      setCoachState((prev) => {
        const nextState = {
          ...prev,
          phase: 'BINGO_WON' as CoachGamePhase,
          bingoWinnerId: payload.playerId,
          bingoWinnerName: payload.playerName,
        };
        roomBus.emit('COACH_STATE_SYNC', roomCode, nextState);
        return nextState;
      });
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

    return () => {
      unsubPick();
      unsubBingoMark();
      unsubBingoClaim();
      unsubMode();
    };
  }, [roomCode]);

  // Draft 45s Countdown Timer & Round Progression
  useEffect(() => {
    if (coachState.phase !== 'DRAFTING') return;

    const interval = window.setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          advanceDraftRound();
          return 45;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [coachState.phase, coachState.roundNumber]);

  // Bingo 4.5s Photo Roulette Advance
  useEffect(() => {
    if (coachState.phase !== 'BINGO_PLAYING') return;

    const interval = window.setInterval(() => {
      advanceBingoRoulette();
    }, 4500);

    return () => window.clearInterval(interval);
  }, [coachState.phase]);

  const advanceBingoRoulette = () => {
    setCoachState((prev) => {
      const nextPlayer = getRandomRoulettePlayer(prev.rouletteHistory.slice(-10));
      const nextState = {
        ...prev,
        currentRoulettePlayer: nextPlayer,
        rouletteHistory: [...prev.rouletteHistory, nextPlayer.id],
      };
      roomBus.emit('COACH_STATE_SYNC', roomCode, nextState);
      return nextState;
    });
  };

  const advanceDraftRound = () => {
    const currentState = coachStateRef.current;
    const currentRound = currentState.roundNumber;
    const targetSlot = COACH_SLOTS_ORDER[(currentRound - 1) % 5];

    // Ensure all players have an entry for this slot
    const updatedSquads = { ...currentState.squads };
    contestants.forEach((c) => {
      const s = updatedSquads[c.id] || { playerId: c.id, playerName: c.name, slots: {} };
      if (!s.slots[targetSlot]) {
        s.slots[targetSlot] = {
          playerName: 'خانة فارغة (انتهى الوقت)',
          isCustom: true,
          conditionId: currentCondition.id,
          conditionTitle: currentCondition.title,
        };
      }
      updatedSquads[c.id] = s;
    });

    if (currentRound >= 5) {
      // 5 rounds completed: Evaluate all squads!
      sound.playSuccess();
      const verdict = evaluateAllSquads(updatedSquads);
      const nextState: CoachRoomState = {
        ...currentState,
        squads: updatedSquads,
        phase: 'VERDICT',
        verdict,
      };
      setCoachState(nextState);
      savePersistedCoachState(roomCode, nextState);
      roomBus.emit('COACH_STATE_SYNC', roomCode, nextState);

      // Async AI Roast & tactical evaluation from Gemini
      evaluateAllSquadsWithAI(updatedSquads)
        .then((aiVerdict) => {
          if (aiVerdict && aiVerdict.evaluations.length > 0) {
            setCoachState((prev) => {
              const withAi = { ...prev, verdict: aiVerdict };
              savePersistedCoachState(roomCode, withAi);
              roomBus.emit('COACH_STATE_SYNC', roomCode, withAi);
              return withAi;
            });
          }
        })
        .catch((err) => {
          console.warn('AI evaluation error, keeping deterministic verdict:', err);
        });
    } else {
      // Advance to next round
      sound.playClick();
      const nextCondition = getRandomDraftCondition(new Set([currentCondition.id]));
      setCurrentCondition(nextCondition);
      setTimerSeconds(45);

      const nextState: CoachRoomState = {
        ...currentState,
        squads: updatedSquads,
        roundNumber: currentRound + 1,
        activeConditionId: nextCondition.id,
        activeConditionTitle: nextCondition.title,
      };
      setCoachState(nextState);
      roomBus.emit('COACH_STATE_SYNC', roomCode, nextState);
    }
  };

  const handleStartGame = () => {
    sound.playSuccess();

    if (coachState.mode === 'draft') {
      const firstCondition = getRandomDraftCondition();
      setCurrentCondition(firstCondition);
      setTimerSeconds(45);

      const nextState: CoachRoomState = {
        ...coachState,
        phase: 'DRAFTING',
        roundNumber: 1,
        activeConditionId: firstCondition.id,
        activeConditionTitle: firstCondition.title,
        claimedPlayers: {},
        squads: {},
        verdict: null,
      };
      setCoachState(nextState);
      roomBus.emit('COACH_STATE_SYNC', roomCode, nextState);
    } else {
      // Bingo Mode Start
      const firstPlayer = getRandomRoulettePlayer();
      const cards: Record<string, BingoCard> = {};
      contestants.forEach((c) => {
        cards[c.id] = generateBingoCard(c.id);
      });

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
      roomBus.emit('COACH_STATE_SYNC', roomCode, nextState);
    }
  };

  const handleReturnToLobby = () => {
    sound.playClick();
    const nextState: CoachRoomState = {
      ...coachState,
      phase: 'LOBBY',
      roundNumber: 1,
      timerSeconds: 45,
      claimedPlayers: {},
      squads: {},
      verdict: null,
      bingoWinnerId: null,
      bingoWinnerName: null,
      currentRoulettePlayer: null,
      rouletteHistory: [],
    };
    setCoachState(nextState);
    savePersistedCoachState(roomCode, nextState);
    roomBus.emit('RETURN_TO_LOBBY', roomCode, {});
    roomBus.emit('COACH_STATE_SYNC', roomCode, nextState);
  };

  const handleExit = () => {
    sound.playClick();
    roomBus.emit('ROOM_CLOSED', roomCode, { reason: 'HOST_CLOSED' });
    roomBus.emit('ROOM_TERMINATED', roomCode, { reason: 'HOST_CLOSED' });
    navigate('/');
  };

  // Render based on current phase
  if (coachState.phase === 'LOBBY') {
    return (
      <CoachLobby
        roomCode={roomCode}
        role="host"
        selectedMode={coachState.mode}
        onSelectMode={(mode) => {
          setCoachState((prev) => {
            const next = { ...prev, mode };
            savePersistedCoachState(roomCode, next);
            roomBus.emit('COACH_MODE_SELECTED', roomCode, { mode });
            roomBus.emit('COACH_STATE_SYNC', roomCode, next);
            return next;
          });
        }}
        onStartGame={handleStartGame}
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
        timerSeconds={coachState.phase === 'DRAFTING' ? timerSeconds : undefined}
        conditionTitle={coachState.phase === 'DRAFTING' ? currentCondition.title : undefined}
        mood={coachState.verdict ? 'happy' : timerSeconds <= 10 ? 'angry' : 'judging'}
        remark={
          coachState.phase === 'VERDICT'
            ? coachState.verdict?.coachBanner || 'انتهى التقييم وحسم الشبح المدرب النتيجة!'
            : coachState.phase === 'BINGO_PLAYING'
            ? 'طابقوا لاعب الروليت مع بطاقاتكم بسرعة!'
            : 'اختر لاعبك التكتيكي بدون ما تكرر لاعب غيرك!'
        }
        isHost
        onSkipTimer={coachState.phase === 'DRAFTING' ? advanceDraftRound : advanceBingoRoulette}
        onReturnToLobby={handleReturnToLobby}
        onExit={handleExit}
      />

      <main className="w-full flex-1 flex flex-col items-center justify-start py-2">
        {coachState.mode === 'draft' ? (
          <CoachDraftTVView
            contestants={contestants}
            squads={coachState.squads}
            verdict={coachState.verdict}
            statusBanner={statusBanner}
          />
        ) : (
          <CoachBingoTVView
            currentRoulettePlayer={coachState.currentRoulettePlayer || null}
            contestants={contestants}
            bingoCards={coachState.bingoCards}
            winnerName={coachState.bingoWinnerName}
            onNextPlayer={advanceBingoRoulette}
            secondsRemaining={4}
          />
        )}
      </main>
    </div>
  );
};
