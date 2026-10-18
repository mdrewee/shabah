import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Tv } from 'lucide-react';
import { ShabahGhost, ShabahMood } from '../components/mascot/ShabahGhost';
import { ShabahWordmark } from '../components/mascot/ShabahWordmark';
import { MatrixSpotlightCanvas } from '../components/effects/MatrixSpotlightCanvas';
import { GameEntryModal } from '../components/modals/GameEntryModal';
import { CoverflowCarousel } from '../components/home/CoverflowCarousel';
import { ContainerScroll } from '../components/ui/container-scroll-animation';
import { SHABAH_GAMES, ShabahGame } from '../data/shabahGames';
import { sound } from '../lib/audio';
import { roomBus } from '../lib/roomBus';
import { getPersistedPlayerName, setPersistedPlayerName, getOrCreatePlayerId } from '../utils/playerSession';
import { createRoom, checkRoomExists, normalizeRoomCode } from '../services/roomService';

const HERO_PHRASES: Array<{
  text: string;
  mood: ShabahMood;
  gaze: { x: number; y: number };
}> = [
  { text: 'تتحداني؟', mood: 'judging', gaze: { x: 4, y: -1 } },
  { text: 'تعال أعلمك اللعب كيف', mood: 'angry', gaze: { x: -4, y: 1 } },
  { text: 'من زمان عنك', mood: 'happy', gaze: { x: 0, y: -2 } },
  { text: 'يلا نلعب', mood: 'idle', gaze: { x: 3, y: 2 } },
  { text: 'ورّني شطارتك', mood: 'judging', gaze: { x: -5, y: 0 } },
  { text: 'جاهز ولا خايف؟', mood: 'surprised', gaze: { x: 0, y: 2 } },
];

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const HomeView: React.FC = () => {
  const navigate = useNavigate();
  const gamesSectionRef = useRef<HTMLElement | null>(null);

  // Scroll tracking (0 -> 240px)
  const [scrollY, setScrollY] = useState(0);

  // Auto-cycling phrase every 2000ms
  const [phraseIndex, setPhraseIndex] = useState(0);

  // Coverflow active index
  const [activeIndex, setActiveIndex] = useState(0);
  const [swipeGaze, setSwipeGaze] = useState<{ x: number; y: number } | null>(null);

  // Explanation Modal state ([شرح])
  const [explainedGame, setExplainedGame] = useState<ShabahGame | null>(null);

  // Requirement 2: Game Entry Modal ([العب] / Card click)
  const [joinModalGame, setJoinModalGame] = useState<ShabahGame | null>(null);
  const [playerNameInput, setPlayerNameInput] = useState(() => getPersistedPlayerName());
  const [joinError, setJoinError] = useState<string | null>(null);

  // Account Modal state ([حسابي])
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountName, setAccountName] = useState(() => getPersistedPlayerName());

  // Compact Room Code state
  const [roomCode, setRoomCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isVerifyingRoom, setIsVerifyingRoom] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const activeIndexRef = useRef(activeIndex);
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    const onScroll = () => {
      setScrollY(window.scrollY || 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Rotate phrase every 2000ms
  useEffect(() => {
    const interval = window.setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % HERO_PHRASES.length);
    }, 2000);
    return () => window.clearInterval(interval);
  }, []);

  const scrollProgress = Math.min(1, Math.max(0, scrollY / 240));
  const isDocked = scrollProgress > 0.65;

  const currentPhrase = HERO_PHRASES[phraseIndex];

  const selectCardIndex = (nextIdx: number) => {
    const total = SHABAH_GAMES.length;
    const normalized = ((nextIdx % total) + total) % total;
    if (normalized === activeIndexRef.current) return;

    const dir = nextIdx > activeIndexRef.current ? -1 : 1;
    setSwipeGaze({ x: dir * 6, y: 2 });
    setActiveIndex(normalized);
    sound.playTick();

    window.setTimeout(() => {
      setSwipeGaze(null);
    }, 450);
  };

  // Requirement 2: Open modal on card or [العب] click
  const openGameJoinModal = (game: ShabahGame) => {
    sound.playClick();
    setJoinModalGame(game);
    setJoinError(null);
    setPlayerNameInput(getPersistedPlayerName());
  };

  // Requirement 2 - Action A: Enter as contestant
  const handleConfirmContestantEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinModalGame || isCreatingRoom) return;

    const cleanName = playerNameInput.trim();
    if (!cleanName || cleanName === 'لاعب') {
      setJoinError('اكتب اسمك الحقيقي أو لقبك أولاً!');
      sound.playTick();
      return;
    }

    setPersistedPlayerName(cleanName);
    const code = generateRoomCode();
    const pid = getOrCreatePlayerId();

    setIsCreatingRoom(true);
    try {
      // Authoritative Supabase room creation so mobile devices can find the room
      await createRoom(code, joinModalGame.id, pid);

      const room = roomBus.createRoom(code);
      room.selectedGameId = joinModalGame.id;
      roomBus.writeLocal(room);
      roomBus.joinRoom(code, cleanName, 'falcon', pid);

      sound.playClick();
      navigate(`/room/${code}/play`);
    } finally {
      setIsCreatingRoom(false);
    }
  };

  // Requirement 2 - Action B: Enter in Screen/TV Host Mode without name
  const handleEnterTVMode = async () => {
    if (!joinModalGame || isCreatingRoom) return;
    sound.playClick();
    const code = generateRoomCode();
    const pid = getOrCreatePlayerId();

    setIsCreatingRoom(true);
    try {
      // Authoritative Supabase room creation
      await createRoom(code, joinModalGame.id, pid);

      const room = roomBus.createRoom(code);
      room.selectedGameId = joinModalGame.id;
      roomBus.writeLocal(room);

      navigate(`/game/${joinModalGame.id}/${code}`);
    } finally {
      setIsCreatingRoom(false);
    }
  };

  // Code entry join with Supabase cross-device room verification
  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError(null);
    const cleanCode = normalizeRoomCode(roomCode);
    if (!cleanCode || cleanCode.length < 3) {
      setCodeError('اكتب كود الغرفة الصحيح أولاً');
      sound.playTick();
      return;
    }

    setIsVerifyingRoom(true);
    try {
      const check = await checkRoomExists(cleanCode);
      if (!check.exists) {
        setCodeError(check.error || 'كود الغرفة غير صحيح أو الغرفة غير موجودة حالياً');
        sound.playTick();
        return;
      }

      sound.playClick();
      navigate(`/enter-name?room=${encodeURIComponent(cleanCode)}`);
    } catch {
      // Graceful fallback to prevent locking out players on unexpected network blip
      sound.playClick();
      navigate(`/enter-name?room=${encodeURIComponent(cleanCode)}`);
    } finally {
      setIsVerifyingRoom(false);
    }
  };

  const scrollToGames = () => {
    sound.playClick();
    if (gamesSectionRef.current) {
      gamesSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: window.innerHeight * 0.85, behavior: 'smooth' });
    }
  };


  return (
    <div
      dir="rtl"
      className="min-h-screen w-full bg-[#000000] text-[#FFFFFF] flex flex-col items-center pb-24 selection:bg-white selection:text-black overflow-x-hidden relative"
    >
      {/* Matrix Code Wall Spotlight Canvas */}
      <MatrixSpotlightCanvas />

      {/* Fixed Top Navigation Bar: [حسابي] | Docked Mascot ONLY | [ألعابي] */}
      <header className="fixed top-0 inset-x-0 z-40 px-4 sm:px-8 py-3 flex items-center justify-between pointer-events-none bg-gradient-to-b from-black/90 via-black/60 to-transparent">
        {/* Right Button: [حسابي] */}
        <div className="pointer-events-auto shabah-pill-wrap">
          <div className="shabah-pill-inner">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setAccountName(getPersistedPlayerName());
                setIsAccountModalOpen(true);
              }}
              className="shabah-pill-surface px-4 sm:px-5 py-1.5 text-xs sm:text-sm font-black text-[#0A0A0A] hover:bg-neutral-100 transition-transform active:scale-95 cursor-pointer block"
            >
              حسابي
            </button>
          </div>
        </div>

        {/* Center Dock: ONLY the scaled-down mascot on scroll (Strictly NO word "شبح") */}
        <div
          style={{
            opacity: scrollProgress,
            transform: `translate3d(0, ${(1 - scrollProgress) * -14}px, 0) scale(${0.85 + scrollProgress * 0.15})`,
          }}
          className={`flex items-center justify-center transition-opacity duration-150 ${
            isDocked ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
          }`}
          onClick={() => {
            if (isDocked) {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          aria-label="الرجوع للأعلى"
        >
          <div className="w-11 h-11 sm:w-13 sm:h-13">
            <ShabahGhost
              mood={currentPhrase.mood}
              gazeOffset={swipeGaze || currentPhrase.gaze}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Left Button: [ألعابي] */}
        <div className="pointer-events-auto shabah-pill-wrap">
          <div className="shabah-pill-inner">
            <button
              type="button"
              onClick={scrollToGames}
              className="shabah-pill-surface px-4 sm:px-5 py-1.5 text-xs sm:text-sm font-black text-[#0A0A0A] hover:bg-neutral-100 transition-transform active:scale-95 cursor-pointer block"
            >
              ألعابي
            </button>
          </div>
        </div>
      </header>

      {/* 3D ContainerScroll Stage: Combine Hero Title + 3D Coverflow Console */}
      <div ref={gamesSectionRef} className="w-full relative z-20">
        <ContainerScroll
          titleComponent={
            <div className="flex flex-col items-center justify-center text-center">
              {/* Shabah Mascot with interactive gaze */}
              <div className="w-40 h-40 sm:w-56 sm:h-56 flex items-center justify-center">
                <ShabahGhost
                  mood={currentPhrase.mood}
                  gazeOffset={swipeGaze || currentPhrase.gaze}
                  className="w-full h-full"
                />
              </div>

              {/* Auto-cycling Speech Bubble */}
              <div className="my-3 shabah-pill-wrap">
                <div className="shabah-pill-inner">
                  <div className="shabah-pill-surface px-6 py-2 text-sm sm:text-base font-black text-[#0A0A0A] min-w-[180px] text-center">
                    {currentPhrase.text}
                  </div>
                </div>
              </div>

              {/* White text + Iridescent border wordmark */}
              <div className="mt-1">
                <ShabahWordmark size="xl" />
              </div>
            </div>
          }
        >
          {/* 5 Official Games Coverflow with Interactive GlowCards */}
          <CoverflowCarousel
            games={SHABAH_GAMES}
            activeIndex={activeIndex}
            onActiveIndexChange={selectCardIndex}
            onPlayGame={openGameJoinModal}
            onExplainGame={(game) => {
              sound.playClick();
              setExplainedGame(game);
            }}
          />

          {/* Compact Room Code Box directly underneath */}
          <div className="w-full mt-4 pb-4 px-4 relative z-20">
            <div className="max-w-md w-full mx-auto shabah-border-wrap">
              <div className="shabah-border-inner">
                <form
                  onSubmit={handleJoinByCode}
                  className="shabah-surface p-4 sm:p-5 flex flex-col"
                >
                  <h3 className="text-sm font-black text-[#0A0A0A] mb-2 text-center">
                    عندك كود غرفة؟
                  </h3>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={roomCode}
                      onChange={(e) => setRoomCode(normalizeRoomCode(e.target.value))}
                      placeholder="اكتب الكود هنا..."
                      maxLength={6}
                      autoCapitalize="characters"
                      autoCorrect="off"
                      spellCheck={false}
                      disabled={isVerifyingRoom}
                      className="flex-1 h-12 px-4 rounded-xl bg-white border-2 border-[#0A0A0A] text-[#0A0A0A] placeholder-neutral-400 text-center font-black tracking-widest uppercase focus:outline-none disabled:opacity-50"
                    />

                    <button
                      type="submit"
                      disabled={isVerifyingRoom}
                      className="h-12 px-6 rounded-xl font-black shabah-btn-black cursor-pointer shrink-0 disabled:opacity-50 flex items-center justify-center min-w-[70px]"
                    >
                      {isVerifyingRoom ? 'نتأكد...' : 'دخول'}
                    </button>
                  </div>

                  {codeError && (
                    <p className="text-xs font-black text-red-600 text-center mt-2">
                      {codeError}
                    </p>
                  )}
                </form>
              </div>
            </div>
          </div>
        </ContainerScroll>
      </div>

      {/* Game Entry Modal (مودال كتابة الاسم + زر وضع الشاشة النقي) */}
      <GameEntryModal
        isOpen={!!joinModalGame}
        game={joinModalGame}
        playerName={playerNameInput}
        error={joinError}
        onNameChange={(val) => {
          setPlayerNameInput(val);
          setJoinError(null);
        }}
        onSubmitContestant={handleConfirmContestantEntry}
        onEnterTVMode={handleEnterTVMode}
        onClose={() => setJoinModalGame(null)}
      />

      {/* Game Explanation Modal ([شرح]) */}
      {explainedGame && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setExplainedGame(null)}
        >
          <div
            className="w-full max-w-sm shabah-border-wrap"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shabah-border-inner">
              <div className="shabah-surface p-6 flex flex-col items-center text-center gap-4">
                <span className="px-3.5 py-1 rounded-full bg-[#0A0A0A] text-white text-xs font-black">
                  {explainedGame.badgeText}
                </span>

                <h3 className="text-2xl sm:text-3xl font-black text-[#0A0A0A]">
                  {explainedGame.title}
                </h3>

                <p className="text-sm sm:text-base font-bold text-neutral-800 leading-relaxed">
                  {explainedGame.shortExplanation}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setExplainedGame(null);
                  }}
                  className="w-full py-3.5 mt-1 rounded-xl text-white font-black text-base shabah-btn-black cursor-pointer"
                >
                  فهمت
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Modal ([حسابي]) */}
      {isAccountModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setIsAccountModalOpen(false)}
        >
          <div
            className="w-full max-w-sm shabah-border-wrap"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shabah-border-inner">
              <div className="shabah-surface p-6 flex flex-col items-center text-center gap-4">
                <h3 className="text-2xl font-black text-[#0A0A0A]">حسابي في شبح</h3>
                <p className="text-xs font-bold text-neutral-600">
                  اسمك المحفوظ للدخول السريع في جميع الغرف
                </p>

                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="اكتب اسمك المفضل..."
                  maxLength={18}
                  className="w-full h-12 px-4 rounded-xl border-2 border-[#0A0A0A] text-[#0A0A0A] text-center font-black focus:outline-none"
                />

                <div className="flex items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      if (accountName.trim()) {
                        setPersistedPlayerName(accountName.trim());
                      }
                      sound.playClick();
                      setIsAccountModalOpen(false);
                    }}
                    className="flex-1 py-3 rounded-xl text-white font-black text-sm shabah-btn-black cursor-pointer"
                  >
                    حفظ الاسم
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAccountModalOpen(false)}
                    className="px-4 py-3 rounded-xl border-2 border-[#0A0A0A] text-[#0A0A0A] font-black text-sm cursor-pointer hover:bg-neutral-100"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeView;
