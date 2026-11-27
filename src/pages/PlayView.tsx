import { checkRoomExists, isRoomHost } from '../services/roomService';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, useNavigationType } from 'react-router-dom';
import { roomBus } from '../lib/roomBus';
import {
  getOrCreatePlayerId,
  getOrCreatePlayerName,
  getPersistedPlayerName,
} from '../utils/playerSession';
import { normalizeGameId, ShabahGameCanonicalId } from '../utils/gameIds';
import { useRoomSync } from '../hooks/useRoomSync';
import { RoomHostControls } from '../components/common/RoomHostControls';
import { RoomReactions } from '../components/common/RoomReactions';

const CoachTVRoot = React.lazy(() => import('./games/coach/CoachTVRoot').then(({ CoachTVRoot }) => ({ default: CoachTVRoot })));
const BrokerTVRoot = React.lazy(() => import('./games/broker/BrokerTVRoot').then(({ BrokerTVRoot }) => ({ default: BrokerTVRoot })));
const JudgeTVRoot = React.lazy(() => import('./games/judge/JudgeTVRoot').then(({ JudgeTVRoot }) => ({ default: JudgeTVRoot })));
const ArabicTVRoot = React.lazy(() => import('./games/arabic/ArabicTVRoot').then(({ ArabicTVRoot }) => ({ default: ArabicTVRoot })));
const GuideTVRoot = React.lazy(() => import('./games/guide/GuideTVRoot').then(({ GuideTVRoot }) => ({ default: GuideTVRoot })));
const CoachMobileRoot = React.lazy(() => import('./games/coach/CoachMobileRoot').then(({ CoachMobileRoot }) => ({ default: CoachMobileRoot })));
const BrokerMobileRoot = React.lazy(() => import('./games/broker/BrokerMobileRoot').then(({ BrokerMobileRoot }) => ({ default: BrokerMobileRoot })));
const ArabicMobileRoot = React.lazy(() => import('./games/arabic/ArabicMobileRoot').then(({ ArabicMobileRoot }) => ({ default: ArabicMobileRoot })));
const JudgeMobileRoot = React.lazy(() => import('./games/judge/JudgeMobileRoot').then(({ JudgeMobileRoot }) => ({ default: JudgeMobileRoot })));
const GuideMobileRoot = React.lazy(() => import('./games/guide/GuideMobileRoot').then(({ GuideMobileRoot }) => ({ default: GuideMobileRoot })));
const FlyingMobileView = React.lazy(() => import('./games/flying/FlyingMobileView').then(({ FlyingMobileView }) => ({ default: FlyingMobileView })));

export const PlayView: React.FC = () => {
  const { code = '' } = useParams<{ code?: string }>();
  const { state } = useLocation();
  const navigationType = useNavigationType();
  const created = state?.createdRoom;
  const createdGame = navigationType !== 'POP' && created?.code === code && typeof created.gameId === 'string' && isRoomHost(code)
    ? normalizeGameId(created.gameId) : null;
  return <VerifiedPlayView key={code} roomCode={code} createdGame={createdGame} />;
};

const VerifiedPlayView: React.FC<{ roomCode: string; createdGame: ShabahGameCanonicalId | null }> = ({ roomCode, createdGame }) => {
  const [game, setGame] = useState<ShabahGameCanonicalId | null | undefined>(createdGame ?? undefined);
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    async function enterRoom() {
      if (createdGame) return;
      const result = await checkRoomExists(roomCode);
      if (!active) return;
      const gameId = result.exists ? normalizeGameId(result.gameId) : null;
      if (!gameId) {
        setGame(null);
        setError(result?.error);
        return;
      }
      if (!isRoomHost(roomCode) && !await roomBus.restoreRoomSnapshot(roomCode)) {
        if (active) {
          setGame(null);
          setError('تعذر استعادة حالة الغرفة، حاول مرة أخرى');
        }
        return;
      }
      if (!active) return;
      setGame(gameId);
    }
    void enterRoom();
    const off = roomBus.on('SHABAH_GAME_CHANGED', ({data}) => {
      const chosenGame = normalizeGameId(data?.gameId);
      if (chosenGame) setGame(chosenGame);
    }, roomCode);
    return () => { active = false; off(); };
  }, [roomCode, createdGame, attempt]);

  if (game) return <ActivePlayView key={game} roomCode={roomCode.toUpperCase()} initialGameId={game} />;
  return (
    <main dir="rtl" className="grid min-h-screen place-content-center gap-4 bg-black px-4 text-center text-white">
      <p role="status">{game === undefined ? 'جاري تحضير الغرفة…' : (error || 'هذه اللعبة غير متاحة')}</p>
      {game === null && <>
        <button type="button" onClick={() => { setGame(undefined); setAttempt(previous => previous + 1); }}>إعادة المحاولة</button>
        <button type="button" onClick={() => navigate('/')}>العودة للرئيسية</button>
      </>}
    </main>
  );
};

const ActivePlayView: React.FC<{ roomCode: string; initialGameId: ShabahGameCanonicalId }> = ({
  roomCode,
  initialGameId,
}) => {
  const arabicNextRound=useRef<()=>void>(()=>{});
  const [playerId] = useState<string>(() => getOrCreatePlayerId());
  const [playerName] = useState<string>(() => {
    return getPersistedPlayerName() || getOrCreatePlayerName('متسابق');
  });

  // Maintain stable Supabase Realtime presence channel across mobile screens
  const { connectedPlayers } = useRoomSync({
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

  // Strict dynamic game routing based on authoritative gameId:
  const renderGame=()=>{
  switch (initialGameId) {
    case 'ai-judge':
      return <div className="flex h-[100dvh] flex-col overflow-hidden">{isRoomHost(roomCode) && <><RoomHostControls roomCode={roomCode} syncEvent="JUDGE_STATE_SYNC" /><JudgeTVRoot mobileContestants={connectedPlayers} /></>}<div className="min-h-0 flex-1 overflow-y-auto"><JudgeMobileRoot /></div></div>;
    case 'ai-coach':
      return <>{isRoomHost(roomCode) && <CoachTVRoot mobileContestants={connectedPlayers} />}<CoachMobileRoot /></>;
    case 'ai-broker':
      return <div className="flex h-[100dvh] flex-col overflow-hidden">
        {isRoomHost(roomCode) && <><RoomHostControls roomCode={roomCode} syncEvent="BROKER_STATE_SYNC" /><BrokerTVRoot mobileContestants={connectedPlayers} /></>}
        <div className="min-h-0 flex-1 overflow-y-auto"><BrokerMobileRoot /></div>
      </div>;
    case 'ai-arabic':
      return <>{isRoomHost(roomCode) && <ArabicTVRoot mobileContestants={connectedPlayers} onNextRoundReady={advance=>{arabicNextRound.current=advance;}} />}<ArabicMobileRoot onNextRound={()=>arabicNextRound.current()} /></>;
    case 'ai-guide':
      return <>{isRoomHost(roomCode) && <GuideTVRoot mobileContestants={connectedPlayers} />}<GuideMobileRoot /></>;
    case 'ai-flying':
      return <div className="flex h-[100dvh] flex-col overflow-hidden">
        {isRoomHost(roomCode) && <RoomHostControls roomCode={roomCode} syncEvent="FLYING_STATE_SYNC" />}
        <div className="min-h-0 flex-1 overflow-y-auto"><FlyingMobileView /></div>
      </div>;
  }
  };
  return <><RoomReactions roomCode={roomCode} playerId={playerId} inline={initialGameId === 'ai-guide' || initialGameId === 'ai-coach'}/>{renderGame()}</>;
};

export default PlayView;
