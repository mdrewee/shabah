import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useRoom, roomBus } from '../lib/roomBus';
import { supabase } from '../lib/supabase';
import { UnifiedShabahLobby } from '../components/lobby/UnifiedShabahLobby';
import { CoachMobileRoot } from './games/coach/CoachMobileRoot';
import { BrokerMobileRoot } from './games/broker/BrokerMobileRoot';
import { ArabicMobileRoot } from './games/arabic/ArabicMobileRoot';
import { JudgeMobileRoot } from './games/judge/JudgeMobileRoot';
import { GuideMobileRoot } from './games/guide/GuideMobileRoot';
import { SHABAH_GAMES } from '../data/shabahGames';
import {
  getOrCreatePlayerId,
  getOrCreatePlayerName,
  getPersistedPlayerName,
} from '../utils/playerSession';
import { normalizeGameId, ShabahGameCanonicalId } from '../utils/gameIds';
import { useRoomSync } from '../hooks/useRoomSync';

export const PlayView: React.FC = () => {
  const params = useParams<{ code?: string; roomCode?: string; roomId?: string; id?: string }>();
  const [searchParams] = useSearchParams();
  const roomCode = (params.code || params.roomCode || params.roomId || params.id || 'SHBH').trim().toUpperCase();
  const navigate = useNavigate();
  const isPlayerHost = searchParams.get('host') === '1';

  const [playerId] = useState<string>(() => getOrCreatePlayerId());
  const [playerName] = useState<string>(() => {
    return getPersistedPlayerName() || getOrCreatePlayerName('متسابق');
  });

  // Maintain stable Supabase Realtime presence channel across mobile screens
  useRoomSync({
    roomCode,
    role: 'contestant',
    playerId,
    playerName,
  });

  // Ensure room exists locally and player is registered
  useEffect(() => {
    if (roomCode) {
      let r = roomBus.getRoom(roomCode);
      if (!r) {
        r = roomBus.createRoom(roomCode);
      }
      const existing = r.players.find((p) => p.id === playerId);
      if (!existing) {
        roomBus.joinRoom(roomCode, playerName, 'falcon', playerId);
      }
    }
  }, [roomCode, playerId, playerName]);

  const { room } = useRoom(roomCode);
  const activeRoom = room || roomBus.getRoom(roomCode);

  const queryGameParam = searchParams.get('game');
  const initialGameId =
    (queryGameParam ? normalizeGameId(queryGameParam) : null) ||
    (activeRoom?.selectedGameId ? normalizeGameId(activeRoom.selectedGameId) : null);

  const [gameId, setGameId] = useState<ShabahGameCanonicalId | null>(initialGameId);
  const [loading, setLoading] = useState<boolean>(!initialGameId);

  // Authoritative query to Supabase (Executed strictly once on mount per roomCode)
  useEffect(() => {
    if (!roomCode) return;

    let isMounted = true;
    const cleanCode = roomCode.toUpperCase().replace(/^ROOM_/, '');

    async function fetchInitialRoom() {
      try {
        const { data } = await supabase
          .from('rooms')
          .select('game_id, status')
          .eq('room_code', cleanCode)
          .maybeSingle();

        if (isMounted && data?.game_id) {
          const canon = normalizeGameId(data.game_id);
          if (canon) {
            setGameId(canon);
            const r = roomBus.getRoom(cleanCode);
            if (r) {
              r.selectedGameId = canon;
              roomBus.writeLocal(r);
            }
          }
        }
      } catch (err) {
        console.warn('[PlayView] fetchInitialRoom err:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchInitialRoom();

    // Real-time broadcast events
    const unsubStart = roomBus.on('GAME_STARTED', (evt: any) => {
      const payload = evt?.data ?? evt;
      const gId = payload?.gameId;
      if (gId) {
        const canon = normalizeGameId(gId);
        if (canon) setGameId(canon);
      }
    });

    const unsubCoach = roomBus.on('COACH_STATE_SYNC', () => setGameId('ai-coach'));
    const unsubBroker = roomBus.on('BROKER_STATE_SYNC', () => setGameId('ai-broker'));
    const unsubArabic = roomBus.on('ARABIC_STATE_SYNC', () => setGameId('ai-arabic'));
    const unsubJudge = roomBus.on('JUDGE_STATE_SYNC', () => setGameId('ai-judge'));
    const unsubGuide = roomBus.on('GUIDE_STATE_SYNC', () => setGameId('ai-guide'));

    const unsubTerminated = roomBus.on('ROOM_TERMINATED', (evt: any) => {
      const payload = evt?.data ?? evt;
      roomBus.leaveRoom();
      sessionStorage.clear();
      localStorage.removeItem('current_room_code');
      alert(payload?.reason || 'تم إنهاء اللعبة والعودة للرئيسية.');
      window.location.href = '/';
    });

    return () => {
      isMounted = false;
      unsubStart();
      unsubCoach();
      unsubBroker();
      unsubArabic();
      unsubJudge();
      unsubGuide();
      unsubTerminated();
    };
  }, [roomCode]);

  // Loading state: prevent premature fallbacks or flashing
  if (loading && !gameId) {
    return (
      <div
        dir="rtl"
        className="min-h-screen min-h-[100dvh] bg-[#000000] flex flex-col items-center justify-center text-white font-sans select-none px-4"
      >
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
        <p className="text-base font-black text-neutral-300">جاري تحضير الغرفة...</p>
      </div>
    );
  }

  // Strict dynamic game routing based on authoritative gameId:
  switch (gameId) {
    case 'ai-judge':
      return <JudgeMobileRoot />;
    case 'ai-coach':
      return <CoachMobileRoot />;
    case 'ai-broker':
      return <BrokerMobileRoot />;
    case 'ai-arabic':
      return <ArabicMobileRoot />;
    case 'ai-guide':
      return <GuideMobileRoot />;
    default: {
      const fallbackGame = SHABAH_GAMES.find((g) => g.id === gameId) || SHABAH_GAMES[0];
      return (
        <UnifiedShabahLobby
          roomCode={roomCode}
          gameId={fallbackGame.id}
          gameTitle={fallbackGame.title}
          role="contestant"
          isPlayerHost={isPlayerHost}
          currentPlayerId={playerId}
          onExit={() => {
            roomBus.leavePlayer(roomCode, playerId);
            navigate('/');
          }}
        />
      );
    }
  }
};

export default PlayView;
