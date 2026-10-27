import React, { useState, useEffect, useRef, useCallback, FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  DraftPhase,
  DraftPosition,
  DraftEventPayload,
  DRAFT_POSITION_NAMES,
  PlayerSquad,
  DraftContestant,
} from './types';
import { DraftCondition } from '../../../data/draftConditions';
import { DRAFT_CURATED_CLUBS, DraftClub } from '../../../data/draftClubs';
import { FootballPlayer } from '../../../data/footballMasterData';
import { searchFootballPlayers } from '../../../utils/footballSearch';
import { DraftTacticalPitch } from './components/DraftTacticalPitch';
import { DraftClubPickerModal } from './components/DraftClubPickerModal';
import { evaluateSquad } from '../../../utils/aiTacticalJudge';
import { sound } from '../../../lib/audio';
import { UnifiedShabahLobby } from '../../../components/lobby/UnifiedShabahLobby';
import { CheckCircle2, Shield, User, Trophy, Pin, RefreshCw } from 'lucide-react';

export const DraftMobileView: FC = () => {
  const { code: rawCode } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const roomCode = (rawCode || '000000').toUpperCase();

  // Player Profile (Unique per browser tab in SessionStorage)
  const [playerId] = useState<string>(() => {
    let pid = sessionStorage.getItem('draft_player_id') || sessionStorage.getItem('party_player_id');
    if (!pid) {
      pid = `p_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      sessionStorage.setItem('draft_player_id', pid);
      sessionStorage.setItem('party_player_id', pid);
    }
    return pid;
  });
  const [playerName, setPlayerName] = useState<string>(() => {
    return (
      sessionStorage.getItem('party_player_name') ||
      sessionStorage.getItem('chain_player_name') ||
      sessionStorage.getItem('draft_player_name') ||
      'لاعب'
    );
  });
  const [selectedClub, setSelectedClub] = useState<DraftClub>(() => {
    const cached = sessionStorage.getItem('draft_player_club');
    if (cached) {
      try { 
        const parsed = JSON.parse(cached);
        if (parsed && parsed.name && parsed.badgeUrl) return parsed;
      } catch {}
    }
    return DRAFT_CURATED_CLUBS[0]; // Guaranteed Default: Al-Hilal
  });

  const [hasJoined, setHasJoined] = useState<boolean>(() => {
    return (
      sessionStorage.getItem(`draft_joined_${roomCode}`) === 'true' &&
      !!sessionStorage.getItem('draft_player_club')
    );
  });
  const [isReady, setIsReady] = useState<boolean>(false);
  const isReadyRef = useRef<boolean>(false);
  useEffect(() => { isReadyRef.current = isReady; }, [isReady]);
  const [isClubModalOpen, setIsClubModalOpen] = useState<boolean>(false);

  // Game Realtime State (5 Rounds Cycle)
  const [phase, setPhase] = useState<DraftPhase>('LOBBY');
  const [round, setRound] = useState<number>(1);
  const [activeCondition, setActiveCondition] = useState<DraftCondition | null>(null);
  const [currentPickerId, setCurrentPickerId] = useState<string>('');
  const [currentPickerName, setCurrentPickerName] = useState<string>('');
  const [draftedPlayerIds, setDraftedPlayerIds] = useState<string[]>([]);
  const [readyForNextRound, setReadyForNextRound] = useState<boolean>(false);

  // Local secret squad picks & conditions per slot
  const [myPicks, setMyPicks] = useState<Record<DraftPosition, FootballPlayer | null>>({
    FWD: null,
    MID: null,
    DEF_1: null,
    DEF_2: null,
    GK: null,
  });

  const [myConditions, setMyConditions] = useState<Record<DraftPosition, DraftCondition | null>>({
    FWD: null,
    MID: null,
    DEF_1: null,
    DEF_2: null,
    GK: null,
  });

  // Selected Target Slot on Personal Tactical Pitch (Gate for Search Bar)
  const [selectedSlotKey, setSelectedSlotKey] = useState<DraftPosition | null>(null);

  // Search & Selection State
  const [query, setQuery] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<FootballPlayer | null>(null);

  // Live Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Global Banned Players Map (normalized name -> picker name)
  const [bannedPlayers, setBannedPlayers] = useState<Record<string, string>>({});

  // References
  const channelRef = useRef<RealtimeChannel | null>(null);
  const playerIdRef = useRef<string>(playerId);
  const playerNameRef = useRef<string>(playerName);
  const selectedClubRef = useRef<DraftClub>(selectedClub);
  const hasJoinedRef = useRef<boolean>(hasJoined);
  const myPicksRef = useRef<Record<DraftPosition, FootballPlayer | null>>(myPicks);
  const myConditionsRef = useRef<Record<DraftPosition, DraftCondition | null>>(myConditions);

  useEffect(() => { playerIdRef.current = playerId; }, [playerId]);
  useEffect(() => { playerNameRef.current = playerName; }, [playerName]);
  useEffect(() => { selectedClubRef.current = selectedClub; }, [selectedClub]);
  useEffect(() => { hasJoinedRef.current = hasJoined; }, [hasJoined]);
  useEffect(() => { myPicksRef.current = myPicks; }, [myPicks]);
  useEffect(() => { myConditionsRef.current = myConditions; }, [myConditions]);

  const isMyTurn = currentPickerId === playerId;
  const isSubscribedRef = useRef<boolean>(false);

  // Realtime Broadcast helper (Guarded against early invocation before SUBSCRIBED)
  const broadcastEvent = useCallback((payload: DraftEventPayload) => {
    if (!channelRef.current || !isSubscribedRef.current) {
      console.warn('[Realtime Mobile] Cannot send event - channel not SUBSCRIBED yet:', payload.action);
      return;
    }
    channelRef.current.send({
      type: 'broadcast',
      event: 'draft_event',
      payload,
    });
    channelRef.current.send({
      type: 'broadcast',
      event: 'draft_action',
      payload,
    });
  }, []);

  // Helper to normalize player names for comparison
  const normalizePlayerName = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[إأآا]/g, 'ا')
      .replace(/[ة]/g, 'ه')
      .replace(/[ى]/g, 'ي')
      .replace(/\s+/g, ' ');
  };

  // Search results from master dataset
  const searchResults = React.useMemo(() => {
    if (!query.trim()) return [];
    return searchFootballPlayers(query, 12);
  }, [query]);

  // Check if typed query matches any banned player
  const customQueryBannedPicker = React.useMemo(() => {
    const qNorm = normalizePlayerName(query);
    if (!qNorm) return null;
    return bannedPlayers[qNorm] || null;
  }, [query, bannedPlayers]);

  // Handle Turn Change Sound & Vibration
  useEffect(() => {
    if (isMyTurn && phase === 'DRAFTING') {
      sound.playWhistle();
      try {
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
      } catch {}
    }
  }, [isMyTurn, phase]);

  // Join Room - Bulletproof with automatic fallback
  const handleJoin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const storedName =
      sessionStorage.getItem('party_player_name') ||
      sessionStorage.getItem('chain_player_name') ||
      sessionStorage.getItem('draft_player_name') ||
      playerName.trim() ||
      'لاعب';

    setPlayerName(storedName);
    playerNameRef.current = storedName;
    sound.playClick();
    const finalClub = selectedClub || DRAFT_CURATED_CLUBS[0];
    setSelectedClub(finalClub);
    selectedClubRef.current = finalClub;

    sessionStorage.setItem('draft_player_id', playerId);
    sessionStorage.setItem('draft_player_name', storedName);
    sessionStorage.setItem('party_player_name', storedName);
    sessionStorage.setItem('draft_player_club', JSON.stringify(finalClub));
    sessionStorage.setItem('draft_room', roomCode);
    sessionStorage.setItem(`draft_joined_${roomCode}`, 'true');
    setHasJoined(true);
    hasJoinedRef.current = true;

    if (channelRef.current) {
      await channelRef.current.track({
        id: playerId,
        name: storedName,
        teamId: finalClub.id,
        teamName: finalClub.name,
        teamLogo: finalClub.badgeUrl,
        selectedClub: finalClub,
        joinedAt: Date.now(),
        isReady: false,
      });

      // Broadcast join event for instant TV sync
      broadcastEvent({
        action: 'PLAYER_READY',
        playerId,
        playerName: storedName,
        selectedClub: finalClub,
        teamLogo: finalClub.badgeUrl,
        isReady: false,
      });
    }
  };

  // Change club dynamically (even from lobby)
  const handleSelectClub = (club: DraftClub) => {
    setSelectedClub(club);
    sessionStorage.setItem('draft_player_club', JSON.stringify(club));
    setIsClubModalOpen(false);

    if (hasJoinedRef.current && channelRef.current) {
      channelRef.current.track({
        id: playerIdRef.current,
        name: playerNameRef.current,
        teamId: club.id,
        teamName: club.name,
        teamLogo: club.badgeUrl,
        selectedClub: club,
        joinedAt: Date.now(),
        isReady,
      });

      broadcastEvent({
        action: 'PLAYER_READY',
        playerId: playerIdRef.current,
        playerName: playerNameRef.current,
        selectedClub: club,
        teamLogo: club.badgeUrl,
        isReady,
      });
    }
  };

  // Lock In Pick into Selected Slot (either from autocomplete or custom pinned name)
  const handleConfirmPick = useCallback((playerToLock?: FootballPlayer) => {
    const target = playerToLock || selectedPlayer;
    if (!target || !selectedSlotKey || !isMyTurn || phase !== 'DRAFTING') return;

    sound.playClick();

    const slotAssigned = selectedSlotKey;
    const currentCond = activeCondition;

    // 1. Update local tactical pitch and conditions map
    const updatedPicks = {
      ...myPicksRef.current,
      [slotAssigned]: target,
    };
    const updatedConditions = {
      ...myConditionsRef.current,
      [slotAssigned]: currentCond,
    };

    setMyPicks(updatedPicks);
    setMyConditions(updatedConditions);

    // Update local banned map
    const norm = normalizePlayerName(target.name);
    setBannedPlayers((prev) => ({
      ...prev,
      [norm]: playerName,
    }));

    setSelectedPlayer(null);
    setSelectedSlotKey(null); // Reset active slot gate
    setQuery('');

    // 2. Immediate Socket Broadcast on Pick: LIVE_PICK_COMMITTED
    channelRef.current?.send({
      type: 'broadcast',
      event: 'draft_action',
      payload: {
        action: 'LIVE_PICK_COMMITTED',
        playerId,
        playerName,
        slotKey: slotAssigned,
        player: {
          name: target.name,
          photo: target.photo || '',
          conditionTitle: currentCond?.title || '',
          conditionPrompt: currentCond?.rulePrompt || currentCond?.title || '',
        },
      },
    });

    broadcastEvent({
      action: 'LIVE_PICK_COMMITTED',
      playerId,
      playerName,
      slotKey: slotAssigned,
      player: {
        name: target.name,
        photo: target.photo || '',
        conditionTitle: currentCond?.title || '',
        conditionPrompt: currentCond?.rulePrompt || currentCond?.title || '',
      },
      pickedPlayerName: target.name,
      conditionTitle: currentCond?.title || '',
    });

    // Also broadcast PLAYER_LOCKED and PLAYER_PICKED for backwards compatibility
    broadcastEvent({
      action: 'PLAYER_LOCKED',
      pickerName: playerName,
      lockedPlayerName: target.name,
      pickedPlayerName: target.name,
      slotKey: slotAssigned,
      conditionTitle: currentCond?.title || '',
      playerId,
      playerName,
    });

    broadcastEvent({
      action: 'PLAYER_PICKED',
      playerId,
      playerName,
      teamLogo: selectedClubRef.current?.badgeUrl,
      selectedClub: selectedClubRef.current,
      slotKey: slotAssigned,
      pickedPlayerName: target.name,
      conditionId: currentCond?.id || '',
      conditionTitle: currentCond?.title || '',
      pickedPosition: slotAssigned,
      pickedPlayer: target,
      appliedCondition: currentCond || undefined,
    });

    // Check if player has now finished all 5 slots
    const totalFilled = Object.values(updatedPicks).filter(Boolean).length;
    if (totalFilled === 5) {
      // Build full PlayerSquad object
      const squadSlots: PlayerSquad['slots'] = {};
      (Object.keys(updatedPicks) as DraftPosition[]).forEach((pos) => {
        const p = updatedPicks[pos];
        const c = updatedConditions[pos];
        if (p) {
          squadSlots[pos] = {
            playerName: p.name,
            conditionId: c?.id || '',
            conditionTitle: c?.title || '',
          };
        }
      });

      const fullSquad: PlayerSquad = {
        playerId,
        playerName,
        teamLogo: selectedClubRef.current?.badgeUrl,
        selectedClub: selectedClubRef.current,
        slots: squadSlots,
      };

      broadcastEvent({
        action: 'DRAFT_COMPLETE',
        playerId,
        playerName,
        selectedClub: selectedClubRef.current,
        squad: fullSquad,
      });
    }
  }, [selectedPlayer, selectedSlotKey, isMyTurn, phase, activeCondition, playerId, playerName, broadcastEvent]);

  // Custom Pinning Handler (If typed name has no matches or player prefers custom pinning)
  const handlePinCustomPlayer = () => {
    const cleanTyped = query.trim();
    if (!cleanTyped || !selectedSlotKey || !isMyTurn || phase !== 'DRAFTING') return;

    const customPlayer: FootballPlayer = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: cleanTyped,
      aliases: [cleanTyped],
      nationality: 'غير محدد',
      nationalityCode: 'UN',
      clubs: [],
      currentClub: 'مخصص',
      position: (selectedSlotKey === 'GK' ? 'GK' : selectedSlotKey === 'MID' ? 'MID' : selectedSlotKey === 'FWD' ? 'FWD' : 'DEF'),
      traits: [],
      trophies: [],
    };

    handleConfirmPick(customPlayer);
  };

  // Supabase Channel (Strict lifecycle tied ONLY to roomCode and playerId)
  useEffect(() => {
    if (!roomCode || !playerId) return;

    let isMounted = true;
    const channelId = `room_${roomCode}_presence`;

    const existingChannel = supabase.getChannels().find(
      (ch) => ch.topic === `realtime:${channelId}` || ch.topic === channelId
    );
    if (existingChannel) {
      try {
        supabase.removeChannel(existingChannel);
      } catch {}
    }

    const channel = supabase.channel(channelId, {
      config: {
        broadcast: { self: false },
        presence: { key: playerId },
      },
    });

    const handleIncomingEvent = (payload: any) => {
      if (!isMounted || !payload) return;
      const ev = payload as DraftEventPayload;

        if (ev.action === 'GAME_START') {
          setPhase('DRAFTING');
          setRound(ev.round || 1);
          setActiveCondition(ev.activeCondition || null);
          setCurrentPickerId(ev.currentPickerId || '');
          setCurrentPickerName(ev.currentPickerName || '');
          setSelectedSlotKey(null);
          setQuery('');
          setSelectedPlayer(null);
          setReadyForNextRound(false);
          setMyPicks({ FWD: null, MID: null, DEF_1: null, DEF_2: null, GK: null });
          setMyConditions({ FWD: null, MID: null, DEF_1: null, DEF_2: null, GK: null });
          if (ev.draftedPlayerIds) setDraftedPlayerIds(ev.draftedPlayerIds);
        } else if (ev.action === 'START_NEXT_ROUND') {
          // Advance to Round N+1 with fresh board and new conditions
          setPhase('DRAFTING');
          setRound(ev.round || (round + 1));
          setActiveCondition(ev.activeCondition || null);
          setCurrentPickerId(ev.currentPickerId || '');
          setCurrentPickerName(ev.currentPickerName || '');
          setSelectedSlotKey(null);
          setQuery('');
          setSelectedPlayer(null);
          setReadyForNextRound(false);
          setMyPicks({ FWD: null, MID: null, DEF_1: null, DEF_2: null, GK: null });
          setMyConditions({ FWD: null, MID: null, DEF_1: null, DEF_2: null, GK: null });
          if (ev.draftedPlayerIds) setDraftedPlayerIds(ev.draftedPlayerIds);
        } else if (ev.action === 'ROUND_ADVANCE') {
          setPhase('DRAFTING');
          if (ev.round) setRound(ev.round);
          if (ev.activeCondition) setActiveCondition(ev.activeCondition);
          if (ev.currentPickerId) setCurrentPickerId(ev.currentPickerId);
          if (ev.currentPickerName) setCurrentPickerName(ev.currentPickerName);
          setSelectedSlotKey(null);
          setQuery('');
          setSelectedPlayer(null);
          if (ev.draftedPlayerIds) setDraftedPlayerIds(ev.draftedPlayerIds);
        } else if (ev.action === 'PLAYER_LOCKED' || ev.action === 'PLAYER_PICKED' || ev.action === 'PICK_LOCKED') {
          if (ev.draftedPlayerIds) setDraftedPlayerIds(ev.draftedPlayerIds);
          if (ev.currentPickerId) {
            setCurrentPickerId(ev.currentPickerId);
            setCurrentPickerName(ev.currentPickerName || '');
          }

          const targetName = ev.lockedPlayerName || ev.pickedPlayerName;
          const picker = ev.pickerName || ev.playerName || 'متسابق';

          if (targetName) {
            const norm = normalizePlayerName(targetName);
            setBannedPlayers((prev) => ({
              ...prev,
              [norm]: picker,
            }));

            // If another player picked this player, show live toast
            if (ev.playerId !== playerIdRef.current) {
              sound.playNotification();
              showToast(`قام ${picker} باختيار ${targetName}!`);
            }
          }
        } else if (ev.action === 'DRAFT_FINISHED' || ev.action === 'FORCE_PUSH_SQUADS') {
          // TV broadcasted that drafting is completed or sync requested: push final completed squad immediately
          const currentPicks = myPicksRef.current;
          const currentConds = myConditionsRef.current;
          const squadSlots: PlayerSquad['slots'] = {};
          (Object.keys(currentPicks) as DraftPosition[]).forEach((pos) => {
            const p = currentPicks[pos];
            const c = currentConds[pos];
            if (p) {
              squadSlots[pos] = {
                playerName: p.name,
                conditionId: c?.id || '',
                conditionTitle: c?.title || '',
              };
            }
          });

          const finalSquadPayload: PlayerSquad = {
            playerId: playerIdRef.current,
            playerName: playerNameRef.current,
            teamLogo: selectedClubRef.current?.badgeUrl,
            selectedClub: selectedClubRef.current,
            slots: squadSlots,
          };

          broadcastEvent({
            action: 'PUSH_FINAL_SQUAD',
            playerId: playerIdRef.current,
            playerName: playerNameRef.current,
            teamLogo: selectedClubRef.current?.badgeUrl,
            selectedClub: selectedClubRef.current,
            squad: finalSquadPayload,
          });
        } else if (ev.action === 'AI_EVALUATION_START') {
          setPhase('AI_REVEAL');
        } else if (ev.action === 'RESET_LOBBY') {
          setPhase('LOBBY');
          setRound(1);
          setIsReady(false);
          setReadyForNextRound(false);
          setMyPicks({ FWD: null, MID: null, DEF_1: null, DEF_2: null, GK: null });
          setMyConditions({ FWD: null, MID: null, DEF_1: null, DEF_2: null, GK: null });
        } else if (ev.action === 'KICK_PLAYER') {
          if (ev.targetPlayerId === playerIdRef.current) {
            sessionStorage.removeItem('draft_player_id');
            sessionStorage.removeItem('draft_player_name');
            sessionStorage.removeItem('draft_player_club');
            sessionStorage.removeItem('draft_room');
            if (channelRef.current) {
              channelRef.current.untrack();
              supabase.removeChannel(channelRef.current);
            }
            alert('تم استبعادك من الغرفة بواسطة المضيف');
            navigate('/', { replace: true });
          }
        } else if (ev.action === 'ROOM_TERMINATED') {
          sessionStorage.removeItem('draft_player_id');
          sessionStorage.removeItem('draft_player_name');
          sessionStorage.removeItem('draft_player_club');
          sessionStorage.removeItem('draft_room');
          navigate('/');
        }
    };

    channel
      .on('presence', { event: 'sync' }, () => {})
      .on('broadcast', { event: 'draft_event' }, ({ payload }) => handleIncomingEvent(payload))
      .on('broadcast', { event: 'draft_action' }, ({ payload }) => handleIncomingEvent(payload))
      .subscribe(async (status) => {
        if (!isMounted) return;
        if (status === 'SUBSCRIBED') {
          console.log('[Mobile] Subscribed to presence channel successfully:', channelId);
          isSubscribedRef.current = true;
          if (hasJoinedRef.current) {
            const clubToTrack = selectedClubRef.current || DRAFT_CURATED_CLUBS[0];
            await channel.track({
              id: playerIdRef.current,
              name: playerNameRef.current || 'لاعب',
              teamId: clubToTrack.id,
              teamName: clubToTrack.name,
              teamLogo: clubToTrack.badgeUrl,
              selectedClub: clubToTrack,
              joinedAt: Date.now(),
              isReady: isReadyRef.current,
            });
          }
        } else {
          isSubscribedRef.current = false;
        }
      });

    channelRef.current = channel;

    return () => {
      isMounted = false;
      isSubscribedRef.current = false;
      channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomCode, playerId, navigate, broadcastEvent]);

  // Team-Only Selection Screen (Contestant Onboarding before Draft)
  if (!hasJoined) {
    const storedName =
      sessionStorage.getItem('party_player_name') ||
      sessionStorage.getItem('chain_player_name') ||
      sessionStorage.getItem('draft_player_name') ||
      playerName ||
      'لاعب';

    return (
      <div
        className="min-h-screen w-full bg-[#E5E0D5] text-[#2C2A29] flex flex-col justify-center items-center p-4 font-sans select-none"
        dir="rtl"
      >
        <div className="w-full max-w-lg bg-[#F7F4EC] border-3 border-[#2C2A29] shadow-[6px_6px_0px_#2C2A29] rounded-2xl p-5 sm:p-6 flex flex-col space-y-4 my-auto">
          {/* Welcoming Header */}
          <div>
            <h2 className="text-xl font-black text-[#2C2A29] text-center mb-1">
              أهلاً يا {storedName}
            </h2>
            <p className="text-sm font-bold text-[#2C2A29]/70 text-center mb-4">
              اختر شعار ناديك للبطولة:
            </p>
          </div>

          {/* 20 Curated Elite Clubs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-[58vh] overflow-y-auto p-1.5 rounded-xl border-2 border-[#2C2A29]/20 bg-white/60">
            {DRAFT_CURATED_CLUBS.map((club) => {
              const isSelected = selectedClub?.id === club.id;
              return (
                <button
                  key={club.id}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSelectedClub(club);
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer text-center relative ${
                    isSelected
                      ? 'bg-[#8A9A5B]/20 border-[#8A9A5B] shadow-[3px_3px_0px_#8A9A5B] scale-[1.02]'
                      : 'bg-white border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29] hover:bg-[#F7F4EC]'
                  }`}
                >
                  <div className="w-12 h-12 flex items-center justify-center mb-1.5">
                    <img
                      src={club.badgeUrl}
                      alt={club.name}
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  </div>
                  <span className="font-black text-xs text-[#2C2A29] leading-tight">
                    {club.name}
                  </span>
                  <span className="text-[10px] text-[#5C4033] font-bold mt-0.5 truncate max-w-full">
                    {club.country}
                  </span>
                  {isSelected && (
                    <div className="absolute top-1.5 left-1.5 bg-[#8A9A5B] text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-black shadow-sm">
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Single primary Olivine Green button at the bottom */}
          <div>
            <button
              type="button"
              onClick={() => handleJoin()}
              className="bg-[#8A9A5B] hover:bg-[#78884E] text-white py-3.5 px-6 rounded-xl font-black text-lg w-full border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_#2C2A29] transition-all cursor-pointer"
            >
              تأكيد ودخول اللوبي
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'LOBBY') {
    const clubSelectorSlot = (
      <div className="flex items-center justify-between bg-[#0A0A0A]/[0.04] border-2 border-[#0A0A0A] rounded-2xl p-3">
        <div className="flex items-center gap-2.5">
          {selectedClub && (
            <img
              src={selectedClub.badgeUrl}
              alt={selectedClub.name}
              className="w-8 h-8 object-contain"
              referrerPolicy="no-referrer"
            />
          )}
          <span className="text-sm font-black text-[#0A0A0A]">
            ناديك: {selectedClub?.name || 'فريق الأحلام'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsClubModalOpen(true)}
          className="bg-[#0A0A0A] text-[#FFFFFF] text-xs font-bold px-3.5 py-1.5 rounded-full"
        >
          تغيير الفريق
        </button>
        <DraftClubPickerModal
          isOpen={isClubModalOpen}
          selectedClubId={selectedClub?.id}
          onSelectClub={(club: any) => {
            setSelectedClub(club);
            sessionStorage.setItem('draft_player_club', JSON.stringify(club));
            setIsClubModalOpen(false);
            broadcastEvent({
              action: 'PLAYER_READY',
              playerId: playerIdRef.current,
              playerName: playerNameRef.current,
              selectedClub: club,
              teamLogo: club.badgeUrl,
              isReady: isReadyRef.current,
            });
          }}
          onClose={() => setIsClubModalOpen(false)}
        />
      </div>
    );

    return (
      <UnifiedShabahLobby
        roomCode={roomCode}
        gameId="draft-5"
        gameTitle="شبح المدرب"
        players={[{ id: playerId, name: playerName, isReady }]}
        role="contestant"
        currentPlayerId={playerId}
        isReady={isReady}
        onToggleReady={() => {
          const nextReady = !isReady;
          setIsReady(nextReady);
          broadcastEvent({
            action: 'PLAYER_READY',
            playerId: playerIdRef.current,
            playerName: playerNameRef.current,
            selectedClub: selectedClubRef.current,
            teamLogo: selectedClubRef.current.badgeUrl,
            isReady: nextReady,
          });
        }}
        onExit={() => navigate('/')}
        extraControls={clubSelectorSlot}
      />
    );
  }

  return (
    <div
      className="min-h-screen w-full bg-[#000000] text-[#FFFFFF] flex flex-col font-sans select-none overflow-x-hidden"
      dir="rtl"
    >
      {/* Live Toast Notification for Locked Player */}
      {toastMessage && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-[90%] w-auto">
          <div className="bg-[#2C2A29] text-[#F7F4EC] border-2 border-[#E5E0D5] py-2 px-4 rounded-xl font-black text-xs sm:text-sm shadow-[3px_3px_0px_#C68B59] flex items-center gap-2">
            <span>🔔</span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Mobile Bar */}
      <header className="w-full bg-[#E5E0D5] border-b-2 border-[#2C2A29] px-4 py-2.5 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          {selectedClub && (
            <img src={selectedClub.badgeUrl} alt={selectedClub.name} className="w-7 h-7 object-contain" referrerPolicy="no-referrer" />
          )}
          <div>
            <h2 className="font-black text-sm text-[#2C2A29] leading-tight">
              {playerName}
            </h2>
            <span className="text-[10px] font-bold text-[#5C4033] block">
              {selectedClub?.name || 'فريق الأحلام'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {phase === 'DRAFTING' && (
            <span className="bg-[#F7F4EC] border border-[#2C2A29] px-2 py-0.5 rounded-lg text-xs font-black text-[#2C2A29]">
              جولة {round}/5
            </span>
          )}
          <span className="font-mono text-xs font-black text-[#5C4033] bg-[#F7F4EC] px-2 py-0.5 rounded-lg border border-[#2C2A29]">
            {roomCode}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col p-3 sm:p-4 max-w-md mx-auto w-full space-y-3 justify-between">
        {/* =======================================================
            STATE: LOBBY
            ======================================================= */}
        {false && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-6 animate-fade-in">
            {/* Club Badge Preview with Change Button */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 bg-white border-3 border-[#2C2A29] shadow-[5px_5px_0px_#2C2A29] rounded-2xl flex items-center justify-center p-3 relative">
                <img src={selectedClub.badgeUrl} alt={selectedClub.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <button
                type="button"
                onClick={() => setIsClubModalOpen(true)}
                className="bg-[#C68B59] hover:bg-[#B57A48] text-white text-xs font-black px-4 py-1.5 rounded-xl border border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer transition-all"
              >
                تغيير الفريق ({selectedClub.name})
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-[#2C2A29]">أهلاً بك {playerName}!</h3>
              <p className="text-xs font-bold text-[#5C4033]">
                أنت تمثل رسمياً نادي <span className="text-[#8A9A5B] font-black">{selectedClub?.name}</span>، اضغط زر الاستعداد للمنافسة!
              </p>
            </div>

            {/* Primary Olivine Green Ready Button */}
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                const nextReady = !isReady;
                setIsReady(nextReady);
                broadcastEvent({
                  action: 'PLAYER_READY',
                  playerId: playerIdRef.current,
                  playerName: playerNameRef.current,
                  selectedClub: selectedClubRef.current,
                  teamLogo: selectedClubRef.current.badgeUrl,
                  isReady: nextReady,
                });
              }}
              className={`w-full max-w-xs py-4 px-6 rounded-2xl font-black text-lg border-3 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2 ${
                isReady
                  ? 'bg-[#8A9A5B] text-[#F7F4EC]'
                  : 'bg-[#F7F4EC] text-[#2C2A29] hover:bg-white'
              }`}
            >
              <CheckCircle2 size={22} className={isReady ? 'text-[#F7F4EC]' : 'text-[#8A9A5B]'} />
              <span>{isReady ? 'أنا جاهز ✓' : 'أنا جاهز'}</span>
            </button>
          </div>
        )}

        {/* =======================================================
            STATE: DRAFTING (Strict 3-Section Vertical Layout)
            ======================================================= */}
        {phase === 'DRAFTING' && (
          <div className="flex-1 flex flex-col justify-between space-y-2.5">
            {/* -----------------------------------------------------
                WAITING STATE BANNER (When NOT my turn)
                ----------------------------------------------------- */}
            {!isMyTurn ? (
              <div className="bg-[#E5E0D5] border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl p-3.5 text-center">
                <span className="inline-block bg-[#C68B59] text-white text-xs font-black px-3 py-1 rounded-full mb-1.5">
                  انتظر دورك
                </span>
                <h3 className="text-lg sm:text-xl font-black text-[#2C2A29]">
                  مو دورك حالياً للاختيار
                </h3>
                <p className="text-xs sm:text-sm font-bold text-[#2C2A29]/80 mt-1">
                  الدور الحالي عند: <span className="text-[#8A9A5B] font-black underline">{currentPickerName || 'المتسابق الآخر'}</span>
                </p>
              </div>
            ) : (
              <div className="bg-[#8A9A5B] border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl p-3 text-center text-white">
                <span className="inline-block bg-[#2C2A29] text-white text-[11px] font-black px-2.5 py-0.5 rounded-full mb-1">
                  دورك الآن ⚡
                </span>
                <h3 className="text-base sm:text-lg font-black leading-tight">
                  اختر لاعباً وثبته في مركزك الآن!
                </h3>
              </div>
            )}

            {/* -----------------------------------------------------
                SECTION 1: TOP CONDITION DISPLAY CARD
                ----------------------------------------------------- */}
            <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] p-3 rounded-xl text-center shadow-[3px_3px_0px_#2C2A29]">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#8A9A5B] block mb-0.5">
                شرط الجولة الحالية
              </span>
              <h3 className="text-base sm:text-lg font-black text-[#2C2A29]">
                {activeCondition ? activeCondition.title : 'جاري سحب الشرط...'}
              </h3>
              <p className="text-[11px] font-bold text-[#5C4033] mt-0.5">
                {activeCondition?.rulePrompt}
              </p>
            </div>

            {/* -----------------------------------------------------
                SECTION 2: TACTICAL HALF-PITCH SQUAD BOARD (40-45% Screen)
                ----------------------------------------------------- */}
            <div className="relative">
              <DraftTacticalPitch
                picks={myPicks}
                selectedPosition={selectedSlotKey}
                onSelectSlot={(pos) => {
                  if (myPicks[pos]) return; // Cannot re-select already filled slot
                  sound.playClick();
                  setSelectedSlotKey(pos);
                  setSelectedPlayer(null);
                }}
                interactive={isMyTurn}
              />
            </div>

            {/* -----------------------------------------------------
                SECTION 3: NAME-ONLY SEARCH & SELECTION CONTROLS
                ----------------------------------------------------- */}
            <div className="space-y-2 bg-[#F7F4EC] border-2 border-[#2C2A29] p-3 rounded-2xl shadow-[3px_3px_0px_#2C2A29]">
              {/* Slot Target Indicator */}
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-[#5C4033]">
                  المركز المستهدف للتثبيت:
                </span>
                {selectedSlotKey ? (
                  <span className="bg-[#8A9A5B] text-white px-2.5 py-0.5 rounded-lg border border-[#2C2A29]">
                    {DRAFT_POSITION_NAMES[selectedSlotKey]}
                  </span>
                ) : (
                  <span className="bg-[#C68B59] text-white px-2.5 py-0.5 rounded-lg border border-[#2C2A29]">
                    اضغط مركزاً في الملعب أولاً 👆
                  </span>
                )}
              </div>

              {/* Search Bar (Enabled only when slot is selected and it's player's turn) */}
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedPlayer(null);
                  }}
                  disabled={!isMyTurn || !selectedSlotKey}
                  placeholder={
                    !isMyTurn
                      ? 'مو دورك.. انتظر دورك للاختيار'
                      : !selectedSlotKey
                      ? 'حدد مركزاً في الملعب أولاً...'
                      : `ابحث عن اسم لاعب لمركز (${DRAFT_POSITION_NAMES[selectedSlotKey]})...`
                  }
                  className={`w-full border-2 border-[#2C2A29] rounded-xl px-4 py-2.5 font-bold text-xs sm:text-sm text-[#2C2A29] focus:outline-none transition-all shadow-[2px_2px_0px_#2C2A29] ${
                    !isMyTurn || !selectedSlotKey
                      ? 'bg-gray-100 placeholder-gray-400 cursor-not-allowed'
                      : 'bg-white placeholder-[#5C4033]/60 focus:bg-[#F7F4EC]'
                  }`}
                />
              </div>

              {/* Clean Autocomplete Dropdown List with Banned Styling */}
              {selectedSlotKey && query.trim() && isMyTurn && (
                <div className="max-h-48 overflow-y-auto border-2 border-[#2C2A29] rounded-xl bg-white divide-y divide-[#2C2A29]/10 shadow-[3px_3px_0px_#2C2A29]">
                  {searchResults.length > 0 ? (
                    searchResults.map((p) => {
                      const isTarget = selectedPlayer?.id === p.id;
                      const norm = normalizePlayerName(p.name);
                      const isBanned = Boolean(bannedPlayers[norm] || draftedPlayerIds.includes(p.id));
                      const pickedBy = bannedPlayers[norm] || 'متسابق آخر';

                      if (isBanned) {
                        return (
                          <div
                            key={p.id}
                            className="p-2.5 flex items-center justify-between text-xs opacity-60 bg-[#E5E0D5] cursor-not-allowed select-none border-b border-[#2C2A29]/10"
                          >
                            <div className="flex items-center gap-2">
                              <span className="line-through text-[#2C2A29] font-bold">{p.name}</span>
                              <span className="bg-[#C68B59] text-white text-[10px] font-black px-2 py-0.5 rounded border border-[#2C2A29]">
                                ممنوع - تم اختياره من {pickedBy}
                              </span>
                            </div>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/10">
                              {p.position}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            sound.playClick();
                            setSelectedPlayer(p);
                            setQuery(p.name);
                          }}
                          className={`p-2.5 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                            isTarget
                              ? 'bg-[#8A9A5B] text-white font-black'
                              : 'hover:bg-[#E5E0D5] text-[#2C2A29] font-bold'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{p.name}</span>
                            <span className="opacity-70 text-[10px]">({p.currentClub || p.nationality})</span>
                          </div>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/10">
                            {p.position}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-3 text-center space-y-2">
                      <p className="text-xs font-bold text-[#5C4033]">
                        لم يتم العثور على اللاعب في قاعدة البيانات.
                      </p>
                      {customQueryBannedPicker ? (
                        <div className="bg-[#E5E0D5] border border-[#C68B59] rounded-lg p-2 text-xs font-black text-[#5C4033]">
                          ⚠️ هذا اللاعب تم اختياره مسبقاً من قبل ({customQueryBannedPicker}) ولا يمكن تثبيته!
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handlePinCustomPlayer}
                          className="w-full bg-[#C68B59] hover:bg-[#B57A48] text-white text-xs font-black py-2 px-3 rounded-lg border border-[#2C2A29] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Pin size={14} />
                          <span>تثبيت "{query.trim()}" كاختيار يدوي</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Warning if typed name is banned */}
              {customQueryBannedPicker && (
                <div className="bg-[#E5E0D5] border-2 border-[#C68B59] rounded-xl p-2.5 text-center text-xs font-black text-[#2C2A29]">
                  ⚠️ هذا اللاعب تم اختياره مسبقاً من قبل ({customQueryBannedPicker}) ولا يمكن تثبيته!
                </div>
              )}

              {/* Confirm Lock-In Button (Ochre Orange bg-[#C68B59]) */}
              <button
                type="button"
                disabled={
                  !isMyTurn ||
                  !selectedSlotKey ||
                  Boolean(customQueryBannedPicker) ||
                  (Boolean(selectedPlayer) && Boolean(bannedPlayers[normalizePlayerName(selectedPlayer!.name)])) ||
                  (!selectedPlayer && !query.trim())
                }
                onClick={() => {
                  if (selectedPlayer) {
                    if (bannedPlayers[normalizePlayerName(selectedPlayer.name)]) {
                      alert('هذا اللاعب تم اختياره مسبقاً ولا يمكن تثبيته!');
                      return;
                    }
                    handleConfirmPick(selectedPlayer);
                  } else if (query.trim()) {
                    if (customQueryBannedPicker) {
                      alert('هذا اللاعب تم اختياره مسبقاً ولا يمكن تثبيته!');
                      return;
                    }
                    handlePinCustomPlayer();
                  }
                }}
                className={`w-full py-3 rounded-xl font-black text-sm border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2 ${
                  isMyTurn &&
                  selectedSlotKey &&
                  !customQueryBannedPicker &&
                  (selectedPlayer ? !bannedPlayers[normalizePlayerName(selectedPlayer.name)] : query.trim())
                    ? 'bg-[#C68B59] hover:bg-[#B57A48] text-[#F7F4EC] cursor-pointer'
                    : 'bg-[#D5CFC5] text-[#5C4033] opacity-60 cursor-not-allowed'
                }`}
              >
                <Trophy size={16} />
                <span>
                  {customQueryBannedPicker
                    ? `ممنوع - تم اختياره من ${customQueryBannedPicker}`
                    : selectedPlayer
                    ? `تثبيت ${selectedPlayer.name} في ${DRAFT_POSITION_SHORT_NAMES_MAP[selectedSlotKey || 'FWD']}`
                    : query.trim() && selectedSlotKey
                    ? `تثبيت "${query.trim()}" يدوياً`
                    : 'حدد لاعباً ومركزاً للتثبيت'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* =======================================================
            STATE: AI_REVEAL & ROUND BREAK
            ======================================================= */}
        {phase === 'AI_REVEAL' && (() => {
          const personalEval = (() => {
            try {
              const c: DraftContestant = {
                id: playerId,
                name: playerName,
                isReady: true,
                selectedClub,
                picks: myPicks,
                pickConditions: myConditions,
              };
              return evaluateSquad(c);
            } catch {
              return null;
            }
          })();

          return (
            <div className="flex-1 flex flex-col items-center justify-start text-center space-y-4 py-3">
              <div className="w-14 h-14 bg-[#8A9A5B] border-3 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-2xl flex items-center justify-center text-2xl text-white">
                ⚡
              </div>

              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-[#2C2A29]">
                  {round >= 5 ? 'اختتام المنافسة والتقييم النهائي!' : `نهاية الجولة ${round} من 5!`}
                </h2>
                <p className="text-xs font-bold text-[#5C4033] max-w-xs mx-auto">
                  {round >= 5
                    ? 'شاهد شاشة التلفزيون لتتويج البطل والتحليل الشامل!'
                    : 'تابع شاشة التلفزيون واضغط الزر أدناه عند استعدادك للجولة التالية!'}
                </p>
              </div>

              {/* Personal Mobile AI Evaluation Card */}
              {personalEval && (
                <div className="w-full bg-[#F7F4EC] border-2 sm:border-3 border-[#2C2A29] rounded-2xl p-4 shadow-[3px_3px_0px_#2C2A29] text-center space-y-3">
                  <div className="flex items-center justify-between border-b-2 border-[#2C2A29]/15 pb-2">
                    <span className="text-xs font-black bg-[#8A9A5B] text-white border border-[#2C2A29] px-2.5 py-0.5 rounded-lg shadow-[1px_1px_0px_#2C2A29]">
                      تقييم الذكاء الاصطناعي لفريقك
                    </span>
                    <span className="text-xs font-bold text-[#2C2A29]">
                      {selectedClub?.name || 'فريقك'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div className="bg-[#E5E0D5] border-2 border-[#2C2A29] rounded-xl p-2.5 shadow-[2px_2px_0px_#2C2A29]">
                      <span className="text-[11px] font-bold text-[#2C2A29]/70 block mb-0.5">نسبة قوة فريقك</span>
                      <span className="text-3xl font-black text-[#8A9A5B] font-mono leading-none">
                        {personalEval.overallPercentage}%
                      </span>
                    </div>

                    <div className="bg-[#E5E0D5] border-2 border-[#2C2A29] rounded-xl p-2.5 shadow-[2px_2px_0px_#2C2A29]">
                      <span className="text-[11px] font-bold text-[#2C2A29]/70 block mb-0.5">الشروط المحققة</span>
                      <span className="text-2xl font-black text-[#2C2A29] leading-none">
                        {personalEval.validConditionsCount} من 5
                      </span>
                    </div>
                  </div>

                  {/* Punchy Tactical Pundit Summary (1-2 lines) */}
                  <div className="bg-white border-2 border-[#2C2A29] rounded-xl p-3 shadow-[2px_2px_0px_#2C2A29]">
                    <span className="text-[10px] font-black text-[#C68B59] block mb-1">
                      {personalEval.critiqueTitle}
                    </span>
                    <p className="text-xs sm:text-sm font-black text-[#2C2A29] leading-snug">
                      {personalEval.critiqueSummary}
                    </p>
                  </div>
                </div>
              )}

              {/* Next Round Ready Button (Ochre Orange bg-[#C68B59]) */}
              {round < 5 && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    const nextState = !readyForNextRound;
                    setReadyForNextRound(nextState);
                    broadcastEvent({
                      action: 'PLAYER_NEXT_ROUND_READY',
                      playerId: playerIdRef.current,
                      playerName: playerNameRef.current,
                      isReady: nextState,
                    });
                  }}
                  className={`w-full max-w-xs py-3.5 px-6 rounded-2xl font-black text-base border-3 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] active:translate-y-0.5 cursor-pointer transition-all flex items-center justify-center gap-2 ${
                    readyForNextRound
                      ? 'bg-[#8A9A5B] text-white'
                      : 'bg-[#C68B59] hover:opacity-95 text-white'
                  }`}
                >
                  <RefreshCw size={18} />
                  <span>{readyForNextRound ? 'بانتظار انطلاق الجولة التالية ✓' : 'جاهز للجولة التالية'}</span>
                </button>
              )}

              {/* Miniature pitch preview of player's picks */}
              <div className="w-full pt-1">
                <DraftTacticalPitch picks={myPicks} interactive={false} />
              </div>
            </div>
          );
        })()}
      </main>

      {/* 20 Curated Clubs Modal */}
      <DraftClubPickerModal
        isOpen={isClubModalOpen}
        selectedClubId={selectedClub?.id}
        onSelectClub={handleSelectClub}
        onClose={() => setIsClubModalOpen(false)}
      />
    </div>
  );
};

const DRAFT_POSITION_SHORT_NAMES_MAP: Record<DraftPosition, string> = {
  FWD: 'المهاجم',
  MID: 'الوسط',
  DEF_1: 'المدافع 1',
  DEF_2: 'المدافع 2',
  GK: 'الحارس',
};
