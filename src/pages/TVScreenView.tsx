import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useRoom, roomBus } from '../lib/roomBus';
import { supabase } from '../lib/supabase';
import { UnifiedShabahLobby } from '../components/lobby/UnifiedShabahLobby';
import { CoachTVRoot } from './games/coach/CoachTVRoot';
import { BrokerTVRoot } from './games/broker/BrokerTVRoot';
import { ArabicTVRoot } from './games/arabic/ArabicTVRoot';
import { JudgeTVRoot } from './games/judge/JudgeTVRoot';
import { GuideTVRoot } from './games/guide/GuideTVRoot';
import { SHABAH_GAMES } from '../data/shabahGames';
import { normalizeGameId, ShabahGameCanonicalId } from '../utils/gameIds';

export const TVScreenView: React.FC = () => {
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
        const { data } = await supabase
          .from('rooms')
          .select('game_id, status')
          .eq('room_code', cleanCode)
          .maybeSingle();

        if (isMounted && data?.game_id) {
          const canon = normalizeGameId(data.game_id);
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

    const unsubStart = roomBus.on('GAME_STARTED', (evt: any) => {
      const payload = evt?.data ?? evt;
      const gId = payload?.gameId;
      if (gId) {
        const canon = normalizeGameId(gId);
        if (canon) setLoadedGameId(canon);
      }
    });

    const unsubCoach = roomBus.on('COACH_STATE_SYNC', () => setLoadedGameId('ai-coach'));
    const unsubBroker = roomBus.on('BROKER_STATE_SYNC', () => setLoadedGameId('ai-broker'));
    const unsubArabic = roomBus.on('ARABIC_STATE_SYNC', () => setLoadedGameId('ai-arabic'));
    const unsubJudge = roomBus.on('JUDGE_STATE_SYNC', () => setLoadedGameId('ai-judge'));
    const unsubGuide = roomBus.on('GUIDE_STATE_SYNC', () => setLoadedGameId('ai-guide'));

    const unsubTerminated = roomBus.on('ROOM_TERMINATED', () => {
      sessionStorage.clear();
      localStorage.removeItem('current_room_code');
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
