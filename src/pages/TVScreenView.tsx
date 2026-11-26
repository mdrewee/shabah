import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useRoom, roomBus } from '../lib/roomBus';
import { UnifiedShabahLobby } from '../components/lobby/UnifiedShabahLobby';
import { checkRoomExists, isRoomHost } from '../services/roomService';
import { SHABAH_GAMES } from '../data/shabahGames';
import { normalizeGameId, ShabahGameCanonicalId } from '../utils/gameIds';
import { RoomReactions } from '../components/common/RoomReactions';

const CoachTVRoot = React.lazy(() => import('./games/coach/CoachTVRoot').then(({ CoachTVRoot }) => ({ default: CoachTVRoot })));
const BrokerTVRoot = React.lazy(() => import('./games/broker/BrokerTVRoot').then(({ BrokerTVRoot }) => ({ default: BrokerTVRoot })));
const ArabicTVRoot = React.lazy(() => import('./games/arabic/ArabicTVRoot').then(({ ArabicTVRoot }) => ({ default: ArabicTVRoot })));
const JudgeTVRoot = React.lazy(() => import('./games/judge/JudgeTVRoot').then(({ JudgeTVRoot }) => ({ default: JudgeTVRoot })));
const GuideTVRoot = React.lazy(() => import('./games/guide/GuideTVRoot').then(({ GuideTVRoot }) => ({ default: GuideTVRoot })));
const FlyingTVRoot = React.lazy(() => import('./games/flying/FlyingTVRoot').then(({ FlyingTVRoot }) => ({ default: FlyingTVRoot })));

export const TVScreenView: React.FC = () => {
  const { code } = useParams<{ code?: string }>();
  const [searchParams] = useSearchParams();
  const roomCode = code || searchParams.get('room') || '';
  return roomCode && isRoomHost(roomCode)
    ? <React.Fragment key={roomCode}><RoomReactions roomCode={roomCode.toUpperCase()}/><HostTVScreen /></React.Fragment>
    : <Navigate to="/" replace />;
};

const HostTVScreen: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ code?: string; roomId?: string; id?: string; gameId?: string }>();
  const [searchParams] = useSearchParams();

  const roomCode = (
    params.code ||
    params.roomId ||
    params.id ||
    searchParams.get('room') ||
    'SHBH'
  )
    .trim()
    .toUpperCase();

  const rawGameId = (params.gameId || searchParams.get('game') || '').trim();
  const { room } = useRoom(roomCode);
  const activeRoom = room || roomBus.getRoom(roomCode);

  const initialGameId =
    (rawGameId ? normalizeGameId(rawGameId) : null) ||
    (activeRoom?.selectedGameId ? normalizeGameId(activeRoom.selectedGameId) : null);

  const [loadedGameId, setLoadedGameId] = useState<ShabahGameCanonicalId | null>(initialGameId);
  const [loading, setLoading] = useState<boolean>(!initialGameId);

  // Authoritative room resolution (Executed strictly once on mount per roomCode)
  useEffect(() => {
    if (!roomCode) return;

    let isMounted = true;
    const cleanCode = roomCode.toUpperCase().replace(/^ROOM_/, '');

    // Create room locally if missing
    if (!roomBus.getRoom(cleanCode)) {
      const r = roomBus.createRoom(cleanCode);
      if (initialGameId) {
        r.selectedGameId = initialGameId;
      }
      roomBus.writeLocal(r);
    }

    async function fetchInitialRoom() {
      try {
        const result = await checkRoomExists(cleanCode);

        if (isMounted && result.gameId) {
          const canon = normalizeGameId(result.gameId);
          if (canon) {
            setLoadedGameId(canon);
            const r = roomBus.getRoom(cleanCode);
            if (r) {
              r.selectedGameId = canon;
              roomBus.writeLocal(r);
            }
          }
        }
      } catch (err) {
        console.warn('[TVScreenView] fetchInitialRoom err:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchInitialRoom();

    const off = roomBus.on('SHABAH_GAME_CHANGED', ({data}) => {
      const gameId = normalizeGameId(data?.gameId);
      if (!gameId) return;
      setLoadedGameId(gameId);
      navigate(`/game/${gameId}/${cleanCode}`, {replace:true});
    }, cleanCode);

    return () => {
      isMounted = false;
      off();
    };
  }, [roomCode, navigate]);

  if (loading && !loadedGameId) {
    return (
      <div
        dir="rtl"
        className="min-h-screen min-h-[100dvh] bg-[#000000] flex flex-col items-center justify-center text-white font-sans select-none px-4"
      >
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
        <p className="text-xl font-black text-neutral-300">جاري تجهيز شاشة العرض...</p>
      </div>
    );
  }

  const finalGameId = loadedGameId || SHABAH_GAMES[0].id;

  switch (finalGameId) {
    case 'ai-judge':
      return <JudgeTVRoot />;
    case 'ai-coach':
      return <CoachTVRoot />;
    case 'ai-broker':
      return <BrokerTVRoot />;
    case 'ai-arabic':
      return <ArabicTVRoot />;
    case 'ai-guide':
      return <GuideTVRoot />;
    case 'ai-flying':
      return <FlyingTVRoot />;
    default: {
      const matchedGame = SHABAH_GAMES.find((g) => g.id === finalGameId) || SHABAH_GAMES[0];
      return (
        <UnifiedShabahLobby
          roomCode={roomCode}
          gameId={matchedGame.id}
          gameTitle={matchedGame.title}
          role="host"
        />
      );
    }
  }
};

export default TVScreenView;
