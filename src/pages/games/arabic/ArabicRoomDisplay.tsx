import { useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { RoomHostControls } from '../../../components/common/RoomHostControls';
import { roomBus } from '../../../lib/roomBus';
import { getOrCreatePlayerId, getPersistedPlayerName } from '../../../utils/playerSession';
import { useArabicModeControls } from './ArabicModeControls';
import { ArabicTVRoot } from './ArabicTVRoot';
import { useLetterRush } from './useLetterRush';

export function ArabicRoomDisplay({ roomCode }: { roomCode: string }) {
  const [playerId] = useState(getOrCreatePlayerId);
  const [playerName] = useState(() => getPersistedPlayerName() || 'المضيف');
  const launchedHere = useRef(false);
  const letterRush = useLetterRush(roomCode, { id: playerId, name: playerName });
  const { board, error, refresh } = letterRush;
  const { cards, manualStart } = useArabicModeControls({ roomCode, host: true, playerId, letterRush,
    onLetterRushLaunch: launching => { launchedHere.current = launching; },
    getPlayers: () => roomBus.getFormattedPlayers(roomCode).filter(player => !player.isHost && player.id !== 'host_tv')
      .map(player => player.id),
  });
  if (board === undefined) return <main dir="rtl" className="grid min-h-screen place-content-center gap-3 text-white">
    <p role="status">{error || 'جاري تجهيز شاشة العرض…'}</p>
    {error && <button type="button" onClick={() => void refresh()}>إعادة المحاولة</button>}
  </main>;
  if (board?.mode === 'letter-rush' && board.phase !== 'lobby') return <Navigate to={launchedHere.current
    ? `/room/${roomCode}/play` : `/display/letter-rush/${roomCode}`} replace />;
  return <>
    <RoomHostControls roomCode={roomCode} syncEvent="ARABIC_STATE_SYNC" />
    <ArabicTVRoot lobbyControls={cards} lobbyStart={manualStart} />
  </>;
}
