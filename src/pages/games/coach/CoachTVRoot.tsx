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
  generatePreloadedBingoPool,
} from './coachSync';
import { evaluateAllSquads, evaluateAllSquadsWithAI } from './coachEvaluationEngine';
import { normalizeFootballSearch } from './footballDataService';
import { getRandomMatchCriteria } from '../../../data/coachCriteria';
import { CoachLobby } from './CoachLobby';
import { CoachTopBar } from './components/CoachTopBar';
import { CoachDraftTVView } from './components/CoachDraftTVView';
import { CoachBingoTVView } from './components/CoachBingoTVView';
import { sound } from '../../../lib/audio';
import { useRoomSync } from '../../../hooks/useRoomSync';
import {
  DRAFT_SLOT_TIME,
  DRAFT_ROUND_TIME,
  TOTAL_COACH_ROUNDS,
  BINGO_ROULETTE_TIME,
} from './coachConfig';

const roundTimeLimit = typeof DRAFT_SLOT_TIME !== 'undefined' ? DRAFT_SLOT_TIME : 30;

export const CoachTVRoot: React.FC = () => {
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

  // Synchronized Coach State
  const [coachState, setCoachState] = useState<CoachRoomState>(() =>
    createInitialCoachState(roomCode, 'draft')
  );

  const coachStateRef = useRef<CoachRoomState>(coachState);
  useEffect(() => {
    coachStateRef.current = coachState;
    savePersistedCoachState(roomCode, coachState);
  }, [coachState, roomCode]);

  // Round Timers
  const [timerSeconds, setTimerSeconds] = useState(roundTimeLimit);
  const [bingoTimerSeconds, setBingoTimerSeconds] = useState(BINGO_ROULETTE_TIME);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Connected contestants (max 10) with TV Sync stability:
  const mergedContestants =
    realtimeContestants.length > 0
      ? realtimeContestants
      : (activeRoom?.players || []).filter((p) => p.id !== 'host_tv');

  const contestants = mergedContestants
    .slice(0, 10)
    .map((p) => ({ id: p.id, name: p.name || 'متسابق' }));

  // Helper to get active condition for current round and slot index
  const getActiveCondition = (state: CoachRoomState) => {
    if (state.matchCriteria && state.matchCriteria.length > 0) {
      const idx = Math.min((state.roundNumber || 1) - 1, state.matchCriteria.length - 1);
      const crit = state.matchCriteria[idx];
      if (crit) {
        return {
          id: crit.id,
          title: crit.title,
          description: crit.description,
          rulePrompt: crit.rulePrompt,
        };
      }
    }
    const conditions = state.matchConditions || [];
    const index = Math.min((state.roundNumber || 1) - 1, conditions.length - 1);
    return conditions[index] || conditions[0] || { id: 'c_default', title: 'شرط تكتيكي', description: '', rulePrompt: '' };
  };

  // Listen to remote room events
  useEffect(() => {
    // 1. Claim Player Request (First-Come, First-Served Exclusivity Engine)
    const unsubClaimRequest = roomBus.on('CLAIM_PLAYER_REQUEST', (evt: any) => {
      const payload = evt?.data || evt;
      if (!payload || !payload.player) return;

      const contestantId = payload.contestantId || payload.playerId;
      if (!contestantId) return;

      const contestantName = payload.contestantName || payload.playerName || 'متسابق';
      const { player, roundIndex, slotKey } = payload;
      const curState = coachStateRef.current;
      if (curState.phase !== 'DRAFTING') return;

      const normName = normalizeFootballSearch(player.name || player.playerName);
      const existingClaim = curState.claimedPlayers[normName];

      // Exclusivity Check: If already claimed by another contestant, reject immediately
      if (existingClaim && existingClaim.contestantId !== contestantId) {
        sound.playBuzz?.();
        roomBus.broadcastClaimPlayerRejected(roomCode, {
          contestantId,
          playerName: player.name || player.playerName,
          reason: `اللاعب حجزه ${existingClaim.contestantName} قبلك! اختر لاعباً آخر بسرعة!`,
        });
        return;
      }

      // Check if player used in previous rounds across match
      if (curState.usedPlayersAcrossMatch && curState.usedPlayersAcrossMatch.includes(normName)) {
        sound.playBuzz?.();
        roomBus.broadcastClaimPlayerRejected(roomCode, {
          contestantId,
          playerName: player.name || player.playerName,
          reason: `اللاعب تم استخدامه في جولة سابقة! اختر لاعباً آخر`,
        });
        return;
      }

      // Claim Granted! Update TV Authoritative Source of Truth
      sound.playSuccess?.();
      const updatedClaims: Record<string, ClaimedPlayerInfo> = {
        ...curState.claimedPlayers,
        [normName]: {
          normalizedName: normName,
          originalName: player.name || player.playerName,
          contestantId,
          contestantName,
          timestamp: Date.now(),
        },
      };

      const curRound = curState.roundNumber || 1;
      const targetSlot = (slotKey as CoachSlotKey) || COACH_SLOTS_ORDER[curRound - 1] || 'FWD';
      const cond = getActiveCondition(curState);

      const pickData: CoachPlayerPick = {
        playerName: player.name || player.playerName,
        isCustom: !player.isLocalDb,
        playerPhoto: player.photoUrl || player.photo,
        matchedDbId: player.id,
        conditionId: cond.id,
        conditionTitle: cond.title,
        confirmedAt: Date.now(),
      };

      const existingSquad = curState.squads[contestantId] || {
        playerId: contestantId,
        playerName: contestantName,
        slots: {},
      };

      const updatedSquads = {
        ...curState.squads,
        [contestantId]: {
          ...existingSquad,
          slots: {
            ...existingSquad.slots,
            [targetSlot]: pickData,
          },
        },
      };

      const updatedSelections = {
        ...(curState.currentRoundSelections || {}),
        [contestantId]: pickData,
      };

      const nextState: CoachRoomState = {
        ...curState,
        claimedPlayers: updatedClaims,
        currentRoundSelections: updatedSelections,
        squads: updatedSquads,
      };

      setCoachState(nextState);
      savePersistedCoachState(roomCode, nextState);

      // Broadcast success & locked IDs to all contestants
      roomBus.broadcastPlayerClaimSuccess(roomCode, {
        contestantId,
        contestantName,
        player,
        pick: pickData,
        slotKey: targetSlot,
        allClaimedIds: Object.keys(updatedClaims),
      });
      roomBus.broadcastCoachSync(roomCode, nextState);

      setStatusBanner(`خطف ${contestantName} النجم ${player.name || player.playerName} رسمياً!`);
      window.setTimeout(() => setStatusBanner(null), 3000);

      // Check if ALL contestants have made their pick for this round
      const allSelected =
        contestants.length > 0 &&
        contestants.every((c) => Boolean(updatedSelections[c.id]));

      if (allSelected) {
        window.setTimeout(() => {
          advanceSimultaneousRound();
        }, 1200);
      }
    });

    const unsubPick = roomBus.on('COACH_PICK_SUBMITTED', (evt: any) => {
      // Forward compatibility with legacy events
      const payload = evt?.data || evt;
      if (!payload || !payload.playerId) return;
      const p = { name: payload.pick?.playerName, id: payload.pick?.matchedDbId };
      roomBus.emit('CLAIM_PLAYER_REQUEST', roomCode, {
        contestantId: payload.playerId,
        contestantName: payload.playerName,
        player: p,
        slotKey: payload.slotKey,
      });
    });

    // Contestant readiness for next round
    const unsubReady = roomBus.on('COACH_ROUND_READY', (evt: any) => {
      const payload = evt?.data || evt;
      if (!payload || !payload.playerId) return;

      setCoachState((prev) => {
        const existing = prev.readyPlayersNextRound || [];
        const isAlreadyReady = existing.includes(payload.playerId);
        const nextReady = isAlreadyReady
          ? existing.filter((id) => id !== payload.playerId)
          : [...existing, payload.playerId];

        const nextState = {
          ...prev,
          readyPlayersNextRound: nextReady,
        };

        roomBus.broadcastCoachSync(roomCode, nextState);

        // Auto-advance if ALL connected contestants are ready
        const allReady =
          contestants.length > 0 &&
          contestants.every((c) => nextReady.includes(c.id));

        if (allReady && prev.phase === 'VERDICT') {
          window.setTimeout(() => {
            handleAdvanceToNextRound();
          }, 600);
        }

        return nextState;
      });
    });

    // Bingo Cell Marked
    const unsubBingoMark = roomBus.on('BINGO_CELL_MARKED', (evt: any) => {
      const payload = evt?.data || evt;
      if (!payload || !payload.playerId) return;

      setCoachState((prev) => {
        const card = prev.bingoCards[payload.playerId];
        if (!card) return prev;

        const updatedCells = [...card.cells];
        if (updatedCells[payload.cellIndex]) {
          updatedCells[payload.cellIndex] = {
            ...updatedCells[payload.cellIndex],
            isMarked: true,
            markedPlayerPhoto: payload.playerPhoto,
            markedPlayerName: payload.playerName,
          };
        }

        const skipVotes = Array.from(new Set([...prev.rouletteSkipVotes, payload.playerId]));

        const nextState: CoachRoomState = {
          ...prev,
          rouletteSkipVotes: skipVotes,
          bingoCards: {
            ...prev.bingoCards,
            [payload.playerId]: {
              ...card,
              cells: updatedCells,
            },
          },
        };

        roomBus.broadcastCoachSync(roomCode, nextState);

        // Early advance if all contestants have marked or skipped
        if (contestants.length > 0 && contestants.every((c) => skipVotes.includes(c.id))) {
          window.setTimeout(() => advanceBingoRoulette(), 400);
        }

        return nextState;
      });
    });

    // Bingo Player Skipped
    const unsubBingoSkip = roomBus.on('BINGO_PLAYER_SKIPPED', (evt: any) => {
      const payload = evt?.data || evt;
      if (!payload || !payload.playerId) return;

      setCoachState((prev) => {
        const skipVotes = Array.from(new Set([...prev.rouletteSkipVotes, payload.playerId]));
        const nextState = { ...prev, rouletteSkipVotes: skipVotes };
        roomBus.broadcastCoachSync(roomCode, nextState);

        // Early advance if all contestants have skipped or marked
        if (contestants.length > 0 && contestants.every((c) => skipVotes.includes(c.id))) {
          window.setTimeout(() => advanceBingoRoulette(), 400);
        }
        return nextState;
      });
    });

    // Bingo Claimed
    const unsubBingoClaim = roomBus.on('BINGO_CLAIMED', (evt: any) => {
      const payload = evt?.data || evt;
      if (!payload || !payload.playerId) return;

      sound.playSuccess();
      setCoachState((prev) => {
        const nextState: CoachRoomState = {
          ...prev,
          phase: 'BINGO_WON',
          bingoWinnerId: payload.playerId,
          bingoWinnerName: payload.playerName,
          readyPlayersNextRound: [],
        };
        roomBus.broadcastCoachSync(roomCode, nextState);
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
      unsubClaimRequest();
      unsubPick();
      unsubReady();
      unsubBingoMark();
      unsubBingoSkip();
      unsubBingoClaim();
      unsubMode();
    };
  }, [roomCode, contestants.length]);

  // Simultaneous Real-Time 30s Countdown Timer per round
  useEffect(() => {
    if (coachState.phase !== 'DRAFTING') return;

    setTimerSeconds(DRAFT_ROUND_TIME);

    const interval = window.setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          advanceSimultaneousRound();
          return 0;
        }
        if (prev <= 6) {
          sound.playTick?.();
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [coachState.phase, coachState.roundNumber]);

  // Advance to Next Round (Simultaneous Real-Time Race)
  const advanceSimultaneousRound = () => {
    const cur = coachStateRef.current;
    if (cur.phase !== 'DRAFTING') return;

    sound.playSuccess?.();
    const curRound = cur.roundNumber || 1;
    const currentSlotKey = COACH_SLOTS_ORDER[curRound - 1] || 'FWD';
    const cond = getActiveCondition(cur);

    // Record empty slot for any contestant who didn't select before timer
    const updatedSquads = { ...cur.squads };
    contestants.forEach((c) => {
      const s = updatedSquads[c.id] || { playerId: c.id, playerName: c.name, slots: {} };
      if (!s.slots[currentSlotKey] || !s.slots[currentSlotKey]?.playerName) {
        s.slots[currentSlotKey] = {
          playerName: 'خانة فارغة (فاتك الوقت)',
          isCustom: true,
          conditionId: cond.id,
          conditionTitle: cond.title,
        };
      }
      updatedSquads[c.id] = s;
    });

    // If 5 rounds completed, trigger final evaluation!
    if (curRound >= 5) {
      sound.playVictory?.();
      const verdict = evaluateAllSquads(updatedSquads);

      const nextCumulative = { ...cur.cumulativeScores };
      verdict.evaluations.forEach((e) => {
        nextCumulative[e.playerId] = (nextCumulative[e.playerId] || 0) + e.totalPercentage;
      });

      const nextState: CoachRoomState = {
        ...cur,
        phase: 'VERDICT',
        squads: updatedSquads,
        verdict,
        cumulativeScores: nextCumulative,
        readyPlayersNextRound: [],
      };

      setCoachState(nextState);
      savePersistedCoachState(roomCode, nextState);
      roomBus.broadcastCoachSync(roomCode, nextState);

      // Async AI Roast & Verification with Gemini
      evaluateAllSquadsWithAI(updatedSquads)
        .then((aiVerdict) => {
          if (aiVerdict && aiVerdict.evaluations.length > 0) {
            setCoachState((prev) => {
              const withAi = { ...prev, verdict: aiVerdict };
              savePersistedCoachState(roomCode, withAi);
              roomBus.broadcastCoachSync(roomCode, withAi);
              return withAi;
            });
          }
        })
        .catch((err) => {
          console.warn('[Coach AI Evaluation] keeping deterministic score:', err);
        });

      return;
    }

    // Advance to next round criteria
    const nextRound = curRound + 1;
    const nextSlotIdx = nextRound - 1;
    const nextCriteriaList = cur.matchCriteria || [];
    const nextCrit = nextCriteriaList[nextRound - 1] || {
      id: `crit_${nextRound}`,
      title: `الشرط التكتيكي ${nextRound}`,
      description: '',
      rulePrompt: '',
    };

    const nextState: CoachRoomState = {
      ...cur,
      phase: 'DRAFTING',
      roundNumber: nextRound,
      slotIndex: nextSlotIdx,
      activeConditionId: nextCrit.id,
      activeConditionTitle: nextCrit.title,
      activeConditionDescription: nextCrit.description,
      currentRoundSelections: {},
      squads: updatedSquads,
      readyPlayersNextRound: [],
      turnSecondsRemaining: DRAFT_ROUND_TIME,
    };

    setTimerSeconds(DRAFT_ROUND_TIME);
    setCoachState(nextState);
    savePersistedCoachState(roomCode, nextState);
    roomBus.broadcastCoachSync(roomCode, nextState);
  };

  // Bingo 8s Photo Roulette Advance with countdown
  useEffect(() => {
    if (coachState.phase !== 'BINGO_PLAYING') return;

    setBingoTimerSeconds(BINGO_ROULETTE_TIME);

    const interval = window.setInterval(() => {
      setBingoTimerSeconds((prev) => {
        if (prev <= 1) {
          advanceBingoRoulette();
          return BINGO_ROULETTE_TIME;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [coachState.phase, coachState.currentRoulettePlayer?.id]);

  const advanceBingoRoulette = () => {
    sound.playRouletteTick();
    setCoachState((prev) => {
      const nextPlayer = getRandomRoulettePlayer(prev.rouletteHistory.slice(-12));
      const nextState: CoachRoomState = {
        ...prev,
        currentRoulettePlayer: nextPlayer,
        rouletteHistory: [...prev.rouletteHistory, nextPlayer.id],
        rouletteSkipVotes: [],
      };
      roomBus.broadcastBingoPlayerSelected(roomCode, nextPlayer);
      roomBus.broadcastCoachSync(roomCode, nextState);
      return nextState;
    });
  };

  // Internal pure function for turn advance & snake draft logic
  const advanceDraftTurnInternal = (currentState: CoachRoomState): CoachRoomState => {
    const order =
      currentState.turnOrder && currentState.turnOrder.length > 0
        ? currentState.turnOrder
        : contestants.map((c) => c.id);

    const curIndex = currentState.turnIndex || 0;
    const nextIndex = curIndex + 1;

    // 1. If more contestants remain in the current condition's turn order
    if (nextIndex < order.length) {
      const nextId = order[nextIndex];
      const nextName = contestants.find((c) => c.id === nextId)?.name || nextId;
      return {
        ...currentState,
        turnIndex: nextIndex,
        currentTurnPlayerId: nextId,
        currentTurnPlayerName: nextName,
        turnSecondsRemaining: 30,
      };
    }

    // 2. All contestants have picked (or forfeited) for this condition!
    const curRound = currentState.roundNumber || 1;
    const currentSlotKey = COACH_SLOTS_ORDER[curRound - 1] || 'FWD';
    const cond = getActiveCondition(currentState);

    // Rule 1.a: Any contestant who missed their pick gets an empty slot (0 points)
    const updatedSquads = { ...currentState.squads };
    contestants.forEach((c) => {
      const s = updatedSquads[c.id] || { playerId: c.id, playerName: c.name, slots: {} };
      if (!s.slots[currentSlotKey] || !s.slots[currentSlotKey]?.playerName) {
        s.slots[currentSlotKey] = {
          playerName: 'خانة فارغة (فاتك الشرط)',
          isCustom: true,
          conditionId: cond.id,
          conditionTitle: cond.title,
        };
      }
      updatedSquads[c.id] = s;
    });

    // 3. Check if all 5 conditions in the match are finished
    if (curRound >= 5) {
      sound.playSuccess();
      const verdict = evaluateAllSquads(updatedSquads);

      const nextCumulative = { ...currentState.cumulativeScores };
      verdict.evaluations.forEach((e) => {
        nextCumulative[e.playerId] = (nextCumulative[e.playerId] || 0) + e.totalPercentage;
      });

      const nextState: CoachRoomState = {
        ...currentState,
        squads: updatedSquads,
        phase: 'VERDICT',
        verdict,
        cumulativeScores: nextCumulative,
        readyPlayersNextRound: [],
        currentTurnPlayerId: null,
        currentTurnPlayerName: null,
      };

      // Async AI roast refinement
      evaluateAllSquadsWithAI(updatedSquads)
        .then((aiVerdict) => {
          if (aiVerdict && aiVerdict.evaluations.length > 0) {
            setCoachState((prev) => {
              const withAi = { ...prev, verdict: aiVerdict };
              savePersistedCoachState(roomCode, withAi);
              roomBus.broadcastCoachSync(roomCode, withAi);
              return withAi;
            });
          }
        })
        .catch((err) => {
          console.warn('AI evaluation error, keeping deterministic verdict:', err);
        });

      return nextState;
    }

    // 4. Advance to Next Condition with Snake Draft Alternating Order
    sound.playSuccess();
    const nextRound = curRound + 1;
    const nextCond = currentState.matchConditions
      ? currentState.matchConditions[nextRound - 1]
      : { id: `cond_${nextRound}`, title: `شرط تكتيكي ${toArabicNumber(nextRound)}`, rulePrompt: '' };

    // Snake Draft Alternating Order:
    // Round 1 (1->2->3), Round 2 (3->2->1), Round 3 (1->2->3), Round 4 (3->2->1), Round 5 (1->2->3)
    const nextOrder =
      nextRound % 2 === 1
        ? contestants.map((c) => c.id)
        : [...contestants].reverse().map((c) => c.id);

    const firstId = nextOrder[0] || '';
    const firstName = contestants.find((c) => c.id === firstId)?.name || firstId;

    return {
      ...currentState,
      roundNumber: nextRound,
      slotIndex: nextRound - 1,
      activeConditionId: nextCond.id,
      activeConditionTitle: nextCond.title,
      claimedPlayers: {},
      squads: updatedSquads,
      turnOrder: nextOrder,
      turnIndex: 0,
      currentTurnPlayerId: firstId,
      currentTurnPlayerName: firstName,
      turnSecondsRemaining: 30,
    };
  };

  const advanceDraftTurn = () => {
    setCoachState((prev) => {
      const next = advanceDraftTurnInternal(prev);
      savePersistedCoachState(roomCode, next);
      roomBus.broadcastCoachSync(roomCode, next);
      return next;
    });
  };

  // Advance from VERDICT to Next Round (Round 1..5)
  const handleAdvanceToNextRound = () => {
    const cur = coachStateRef.current;
    if (cur.roundNumber >= cur.totalRounds) {
      // Final round completed: return to lobby
      handleReturnToLobby();
      return;
    }

    sound.playSuccess();
    const nextRound = cur.roundNumber + 1;
    const nextSlotIdx = 0;
    const nextCond = cur.matchConditions
      ? cur.matchConditions[(nextRound - 1) * 5 + nextSlotIdx]
      : getActiveCondition(cur);

    // Reset current round squads for fresh 5 slots, but keep usedPlayersAcrossMatch!
    const cleanSquads: Record<string, CoachSquad> = {};
    contestants.forEach((c) => {
      cleanSquads[c.id] = { playerId: c.id, playerName: c.name, slots: {} };
    });

    setTimerSeconds(roundTimeLimit);

    const nextState: CoachRoomState = {
      ...cur,
      phase: 'DRAFTING',
      roundNumber: nextRound,
      slotIndex: nextSlotIdx,
      activeConditionId: nextCond?.id,
      activeConditionTitle: nextCond?.title,
      claimedPlayers: {},
      squads: cleanSquads,
      readyPlayersNextRound: [],
      verdict: null,
    };

    setCoachState(nextState);
    savePersistedCoachState(roomCode, nextState);
    roomBus.broadcastCoachSync(roomCode, nextState);
  };

  const handleStartGame = () => {
    sound.playSuccess();

    if (coachState.mode === 'draft') {
      const matchCriteria = getRandomMatchCriteria(5);
      const firstCrit = matchCriteria[0];

      const cleanSquads: Record<string, CoachSquad> = {};
      contestants.forEach((c) => {
        cleanSquads[c.id] = { playerId: c.id, playerName: c.name, slots: {} };
      });

      setTimerSeconds(DRAFT_ROUND_TIME);

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
        squads: cleanSquads,
        verdict: null,
      };

      setCoachState(nextState);
      savePersistedCoachState(roomCode, nextState);
      roomBus.broadcastCoachSync(roomCode, nextState);
    } else {
      // Bingo Mode Start
      sound.playRouletteTick();
      generatePreloadedBingoPool();
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
        rouletteSkipVotes: [],
        bingoCards: cards,
        readyPlayersNextRound: [],
        bingoWinnerId: null,
        bingoWinnerName: null,
      };

      setCoachState(nextState);
      savePersistedCoachState(roomCode, nextState);
      roomBus.broadcastBingoPlayerSelected(roomCode, firstPlayer);
      roomBus.broadcastCoachSync(roomCode, nextState);
    }
  };

  const handleRestartBingoRound = () => {
    sound.playRouletteTick();
    generatePreloadedBingoPool();
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
      rouletteSkipVotes: [],
      bingoCards: cards,
      readyPlayersNextRound: [],
      bingoWinnerId: null,
      bingoWinnerName: null,
    };

    setCoachState(nextState);
    savePersistedCoachState(roomCode, nextState);
    roomBus.broadcastBingoPlayerSelected(roomCode, firstPlayer);
    roomBus.broadcastCoachSync(roomCode, nextState);
  };

  const handleReturnToLobby = () => {
    sound.playClick();
    const nextState: CoachRoomState = {
      ...coachState,
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
      currentRoulettePlayer: null,
      rouletteHistory: [],
      rouletteSkipVotes: [],
    };
    setCoachState(nextState);
    savePersistedCoachState(roomCode, nextState);
    roomBus.broadcastReturnToLobby(roomCode);
    roomBus.broadcastCoachSync(roomCode, nextState);
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
          if (mode === 'bingo') {
            generatePreloadedBingoPool();
          }
          setCoachState((prev) => {
            const next = { ...prev, mode };
            savePersistedCoachState(roomCode, next);
            roomBus.emit('COACH_MODE_SELECTED', roomCode, { mode });
            roomBus.broadcastCoachSync(roomCode, next);
            return next;
          });
        }}
        onStartGame={handleStartGame}
        onExit={handleExit}
      />
    );
  }

  const currentCondition = getActiveCondition(coachState);

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full bg-[#000000] text-[#FFFFFF] flex flex-col justify-between selection:bg-white selection:text-black overflow-x-hidden font-sans"
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
            ? coachState.verdict?.coachBanner || 'انتهى تقييم الجولة وحسم الشبح المدرب النتيجة!'
            : coachState.phase === 'BINGO_PLAYING'
            ? 'طابقوا لاعب الروليت مع بطاقاتكم بسرعة!'
            : `جولة ${coachState.roundNumber} من ٥ • اختر لاعبك التكتيكي بدون ما تكرر لاعب غيرك!`
        }
        isHost
        onSkipTimer={coachState.phase === 'DRAFTING' ? advanceSimultaneousRound : advanceBingoRoulette}
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
            roundNumber={coachState.roundNumber}
            totalRounds={coachState.totalRounds || 5}
            readyPlayers={coachState.readyPlayersNextRound || []}
            claimedPlayers={coachState.claimedPlayers}
            currentRoundSelections={coachState.currentRoundSelections || {}}
            turnSecondsRemaining={timerSeconds}
            activeConditionDescription={currentCondition.description}
            onNextRound={advanceSimultaneousRound}
            onReturnToLobby={handleReturnToLobby}
          />
        ) : (
          <CoachBingoTVView
            currentRoulettePlayer={coachState.currentRoulettePlayer || null}
            contestants={contestants}
            bingoCards={coachState.bingoCards}
            winnerName={coachState.bingoWinnerName}
            onNextPlayer={advanceBingoRoulette}
            onNextRound={handleRestartBingoRound}
            onReturnToLobby={handleReturnToLobby}
            secondsRemaining={bingoTimerSeconds}
          />
        )}
      </main>
    </div>
  );
};
