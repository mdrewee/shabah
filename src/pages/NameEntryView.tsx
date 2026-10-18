import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { ShabahGhost, ShabahMood } from '../components/mascot/ShabahGhost';
import { SHABAH_GAMES } from '../data/shabahGames';
import { roomBus } from '../lib/roomBus';
import { sound } from '../lib/audio';
import {
  getOrCreatePlayerId,
  getPersistedPlayerName,
  setPersistedPlayerName,
} from '../utils/playerSession';
import { createRoom, checkRoomExists, normalizeRoomCode } from '../services/roomService';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function mapShabahIdToEngineId(gameId: string): string {
  switch (gameId) {
    case 'ai-judge':
    case 'ai-lawyer':
      return 'ai-lawyer';
    case 'ai-coach':
    case 'draft-5':
      return 'draft-5';
    case 'ai-broker':
    case 'the-scammer':
      return 'the-scammer';
    case 'ai-arabic':
    case 'scattergories':
      return 'scattergories';
    case 'ai-guide':
    case 'geo-blind-tourism':
      return 'geo-blind-tourism';
    default:
      return 'ai-lawyer';
  }
}

export const NameEntryView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const params = useParams<{ code?: string }>();

  const rawRoom = searchParams.get('room') || searchParams.get('code') || params.code || '';
  const queryRoom = normalizeRoomCode(rawRoom);
  const queryGame = (searchParams.get('game') || '').trim();

  const [playerName, setPlayerName] = useState<string>(() => getPersistedPlayerName());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mood, setMood] = useState<ShabahMood>('judging');
  const [gazeOffset, setGazeOffset] = useState<{ x: number; y: number } | null>(null);

  const selectedGame = SHABAH_GAMES.find((g) => g.id === queryGame);

  useEffect(() => {
    if (playerName.trim().length > 0) {
      setMood('happy');
      const shiftX = Math.max(-6, Math.min(6, (playerName.length % 7) - 3));
      setGazeOffset({ x: shiftX, y: 2 });
    } else {
      setMood('judging');
      setGazeOffset({ x: 0, y: 2 });
    }
  }, [playerName]);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);

    const cleanName = playerName.trim();
    if (!cleanName || cleanName === 'لاعب') {
      setErrorMsg('اكتب اسمك الحقيقي أو لقبك عشان تدخل اللوبي!');
      setMood('angry');
      sound.playTick();
      return;
    }

    setPersistedPlayerName(cleanName);
    const pid = getOrCreatePlayerId();

    setIsSubmitting(true);
    try {
      // Case 1: Creating/Starting a Game from Home ([العب])
      if (queryGame && !queryRoom) {
        const code = generateRoomCode();
        const engineGameId = mapShabahIdToEngineId(queryGame);

        await createRoom(code, engineGameId, pid);

        const room = roomBus.createRoom(code);
        room.selectedGameId = engineGameId;
        roomBus.writeLocal(room);

        if (engineGameId === 'geo-blind-tourism') {
          roomBus.initTourismGame(code);
        }

        sessionStorage.setItem(
          `taghesi_player_${code}`,
          JSON.stringify({ id: pid, name: cleanName, roomCode: code })
        );
        localStorage.setItem(
          `taghesi_player_${code}`,
          JSON.stringify({ id: pid, name: cleanName, roomCode: code })
        );

        sound.playClick();
        const canonicalGameId = selectedGame ? selectedGame.id : 'ai-judge';
        navigate(`/game/${canonicalGameId}/${code}`, { replace: true });
        return;
      }

      // Case 2: Joining an existing Room by Code ([دخول] or QR Scan)
      const targetRoomCode = queryRoom || generateRoomCode();
      if (queryRoom) {
        const check = await checkRoomExists(targetRoomCode);
        if (!check.exists) {
          setErrorMsg(check.error || 'كود الغرفة غير صحيح أو تم إغلاقها من قِبل المضيف');
          setMood('angry');
          sound.playTick();
          return;
        }
      } else {
        await createRoom(targetRoomCode, 'ai-coach', pid);
      }

      const existing = roomBus.getRoom(targetRoomCode);
      if (!existing) {
        roomBus.createRoom(targetRoomCode);
      }

      const res = roomBus.joinRoom(targetRoomCode, cleanName, 'falcon', pid);
      if (!res.ok) {
        setErrorMsg(res.reason || 'تعذر الانضمام للغرفة، تأكد من الكود');
        setMood('surprised');
        return;
      }

      sessionStorage.setItem(
        `taghesi_player_${targetRoomCode}`,
        JSON.stringify({ id: pid, name: cleanName, roomCode: targetRoomCode })
      );
      localStorage.setItem(
        `taghesi_player_${targetRoomCode}`,
        JSON.stringify({ id: pid, name: cleanName, roomCode: targetRoomCode })
      );

      sound.playClick();
      navigate(`/room/${targetRoomCode}/play`, { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen min-h-[100dvh] w-full bg-[#000000] text-[#FFFFFF] flex flex-col items-center justify-center px-4 py-8 select-none"
    >
      {/* Top Back Button */}
      <div className="fixed top-4 right-4 z-30">
        <div className="shabah-pill-wrap">
          <div className="shabah-pill-inner">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                navigate('/');
              }}
              className="shabah-pill-surface px-4 py-1.5 text-xs sm:text-sm font-black text-[#0A0A0A] hover:bg-neutral-100 transition-transform active:scale-95 cursor-pointer block"
            >
              رجوع للرئيسية
            </button>
          </div>
        </div>
      </div>

      {/* Shabah Mascot Watching at Top */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-28 h-28 sm:w-36 sm:h-36">
          <ShabahGhost mood={mood} gazeOffset={gazeOffset} className="w-full h-full" />
        </div>

        <div className="mt-2 shabah-pill-wrap">
          <div className="shabah-pill-inner">
            <div className="shabah-pill-surface px-4 py-1.5 text-xs sm:text-sm font-black text-[#0A0A0A]">
              {selectedGame
                ? `تجهيز غرفة: ${selectedGame.title}`
                : queryRoom
                ? `الانضمام لغرفة: ${queryRoom}`
                : 'سجّل حضورك مع شبح'}
            </div>
          </div>
        </div>
      </div>

      {/* White Card with Colorful Iridescent Double Border */}
      <div className="w-full max-w-md shabah-border-wrap">
        <div className="shabah-border-inner">
          <form
            onSubmit={handleConfirm}
            className="shabah-surface p-6 sm:p-7 flex flex-col gap-5 text-center"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0A0A0A]">
                اكتب اسمك عشان تدخل
              </h1>
              <p className="text-xs sm:text-sm font-bold text-neutral-600 mt-1">
                بيظهر اسمك لكل الموجودين في اللوبي
              </p>
            </div>

            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="اكتب اسمك هنا..."
              maxLength={18}
              autoFocus
              className="w-full h-14 px-4 rounded-xl bg-neutral-50 border-[3px] border-[#0A0A0A] text-[#0A0A0A] placeholder-neutral-400 text-lg font-black text-center focus:outline-none focus:bg-white transition-colors"
            />

            {errorMsg && (
              <div className="px-3.5 py-2.5 rounded-xl bg-red-50 border-2 border-red-600 text-red-700 text-xs font-black text-center">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl text-[#FFFFFF] text-base sm:text-lg font-black shabah-btn-black cursor-pointer disabled:opacity-50 flex items-center justify-center"
            >
              {isSubmitting ? 'نتأكد من الغرفة...' : 'تأكيد ودخول اللوبي'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
