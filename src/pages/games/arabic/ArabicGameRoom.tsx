import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoomHostControls } from '../../../components/common/RoomHostControls';
import { RoomReactions } from '../../../components/common/RoomReactions';
import { useConfirmation } from '../../../components/common/ConfirmationProvider';
import { roomBus } from '../../../lib/roomBus';
import { isRoomHost } from '../../../services/roomService';
import { useArabicModeControls } from './ArabicModeControls';
import { ArabicMobileRoot } from './ArabicMobileRoot';
import { ArabicTVRoot } from './ArabicTVRoot';
import { LetterRushStage } from './LetterRushStage';
import { useLetterRush } from './useLetterRush';
import type { ShabahLobbyPlayer } from '../../../components/lobby/UnifiedShabahLobby';

export function ArabicGameRoom({ roomCode, playerId, playerName, players }: {
  roomCode: string;
  playerId: string;
  playerName: string;
  players: ShabahLobbyPlayer[];
}) {
  const advanceRef = useRef<() => void>();
  const setAdvance = useCallback((handler: () => void) => { advanceRef.current = handler; }, []);
  const navigate = useNavigate();
  const confirm = useConfirmation();
  const host = isRoomHost(roomCode);
  const letterRush = useLetterRush(roomCode, { id: playerId, name: playerName });
  const { board, error, call, refresh, offset } = letterRush;
  const { cards, manualStart } = useArabicModeControls({ roomCode, host, playerId, letterRush,
    getPlayers: () => [playerId, ...players.filter(player => player.isOnline !== false).map(player => player.id)],
  });

  if (board === undefined) return <main dir="rtl" className="letter-screen letter-wait">
    <p role="status">{error || 'جاري تحضير الشبح العربي…'}</p>
    {error && <button type="button" className="letter-button" onClick={() => void refresh()}>إعادة المحاولة</button>}
  </main>;

  if (board?.phase === 'ended') return <main dir="rtl" className="letter-screen letter-wait">
    <p role="status">انتهت الغرفة</p>
    <button type="button" className="letter-button" onClick={() => navigate('/')}>العودة للرئيسية</button>
  </main>;

  if (board && board.phase !== 'lobby') {
    return <LetterRushStage board={board} offset={offset} roomCode={roomCode} playerId={playerId} call={call} error={error}
      onEnd={host ? async () => {
        if (!await confirm('تنهي الغرفة وتخرج جميع اللاعبين؟')) return;
        if (await roomBus.terminateRoom(roomCode)) navigate('/');
        else alert('تعذر إنهاء الغرفة، حاول مرة أخرى.');
      } : undefined} />;
  }

  return <>
    <RoomReactions roomCode={roomCode} playerId={playerId} />
    {host && <>
      <RoomHostControls roomCode={roomCode} syncEvent="ARABIC_STATE_SYNC" />
      <ArabicTVRoot mobileContestants={players} onNextRoundReady={setAdvance} />
    </>}
    <ArabicMobileRoot onNextRound={() => advanceRef.current?.()} lobbyControls={cards} lobbyStart={manualStart} />
  </>;
}
