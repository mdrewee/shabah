import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, ChevronDown, Tv } from 'lucide-react';
import { ShabahGhost, ShabahMood } from '../components/mascot/ShabahGhost';
import { ShabahWordmark } from '../components/mascot/ShabahWordmark';
import { MatrixSpotlightCanvas } from '../components/effects/MatrixSpotlightCanvas';
import { GameEntryModal } from '../components/modals/GameEntryModal';
import { SHABAH_GAMES, ShabahGame } from '../data/shabahGames';
import { sound } from '../lib/audio';
import { roomBus } from '../lib/roomBus';
import { getPersistedPlayerName, setPersistedPlayerName, getOrCreatePlayerId } from '../utils/playerSession';

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

  // Touch swipe tracking for Coverflow
  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef<number>(0);

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
    if (normalized === activeIndex) return;

    const dir = nextIdx > activeIndex ? -1 : 1;
    setSwipeGaze({ x: dir * 6, y: 2 });
    setActiveIndex(normalized);
    sound.playTick();

    window.setTimeout(() => {
      setSwipeGaze(null);
    }, 450);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchDeltaXRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    touchDeltaXRef.current = e.touches[0].clientX - touchStartXRef.current;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null) return;
    const delta = touchDeltaXRef.current;
    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;

    if (Math.abs(delta) > 38) {
      if (delta > 0) {
        selectCardIndex(activeIndex + 1);
      } else {
        selectCardIndex(activeIndex - 1);
      }
    }
  };

  // Requirement 2: Open modal on card or [العب] click
  const openGameJoinModal = (game: ShabahGame) => {
    sound.playClick();
    setJoinModalGame(game);
    setJoinError(null);
    setPlayerNameInput(getPersistedPlayerName());
  };

  // Requirement 2 - Action A: Enter as contestant
  const handleConfirmContestantEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinModalGame) return;

    const cleanName = playerNameInput.trim();
    if (!cleanName || cleanName === 'لاعب') {
      setJoinError('اكتب اسمك الحقيقي أو لقبك أولاً!');
      sound.playTick();
      return;
    }

    setPersistedPlayerName(cleanName);
    const code = generateRoomCode();
    const pid = getOrCreatePlayerId();

    const room = roomBus.createRoom(code);
    room.selectedGameId = joinModalGame.id;
    roomBus.writeLocal(room);
    roomBus.joinRoom(code, cleanName, 'falcon', pid);

    sound.playClick();
    navigate(`/room/${code}/play`);
  };

  // Requirement 2 - Action B: Enter in Screen/TV Host Mode without name
  const handleEnterTVMode = () => {
    if (!joinModalGame) return;
    sound.playClick();
    const code = generateRoomCode();

    const room = roomBus.createRoom(code);
    room.selectedGameId = joinModalGame.id;
    roomBus.writeLocal(room);

    navigate(`/game/${joinModalGame.id}/${code}`);
  };

  // Code entry join
  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError(null);
    const cleanCode = roomCode.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 3) {
      setCodeError('اكتب كود الغرفة الصحيح أولاً');
      sound.playTick();
      return;
    }
    sound.playClick();
    navigate(`/enter-name?room=${encodeURIComponent(cleanCode)}`);
  };

  const scrollToGames = () => {
    sound.playClick();
    if (gamesSectionRef.current) {
      gamesSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: window.innerHeight * 0.85, behavior: 'smooth' });
    }
  };

  // Compute circular offset (-2, -1, 0, +1, +2)
  const getRelativeOffset = (index: number): number => {
    const total = SHABAH_GAMES.length;
    let diff = index - activeIndex;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return diff;
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

      {/* Hero Section */}
      <section className="min-h-screen w-full flex flex-col items-center justify-center px-4 relative z-20">
        <div
          style={{
            opacity: Math.max(0, 1 - scrollProgress * 1.15),
            transform: `translate3d(0, ${-scrollProgress * 60}px, 0) scale(${1 - scrollProgress * 0.45})`,
          }}
          className="flex flex-col items-center justify-center text-center will-change-transform"
        >
          {/* Auto-cycling Speech Bubble */}
          <div className="mb-4 shabah-pill-wrap">
            <div className="shabah-pill-inner">
              <div className="shabah-pill-surface px-6 py-2 text-sm sm:text-base font-black text-[#0A0A0A] min-w-[180px] text-center">
                {currentPhrase.text}
              </div>
            </div>
          </div>

          {/* Large Shabah Mascot */}
          <div className="w-52 h-52 sm:w-64 sm:h-64 flex items-center justify-center">
            <ShabahGhost
              mood={currentPhrase.mood}
              gazeOffset={swipeGaze || currentPhrase.gaze}
              className="w-full h-full"
            />
          </div>

          {/* Requirement 1: White text + Iridescent border + overflow visible & no tail clipping */}
          <div className="mt-1">
            <ShabahWordmark size="xl" />
          </div>
        </div>

        {/* Scroll Cue */}
        <button
          type="button"
          onClick={scrollToGames}
          style={{ opacity: Math.max(0, 1 - scrollProgress * 2) }}
          className="absolute bottom-8 flex flex-col items-center gap-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <span className="text-xs font-black">انزل للألعاب</span>
          <ChevronDown className="w-5 h-5" />
        </button>
      </section>

      {/* Coverflow Game Cards Section (Requirement 4: Focused lighting on active card) */}
      <section
        ref={gamesSectionRef}
        className="w-full max-w-5xl mx-auto pt-12 pb-6 px-4 flex flex-col items-center relative z-20"
      >
        <div
          className="relative w-full h-[500px] sm:h-[535px] flex items-center justify-center select-none"
          style={{ perspective: '1000px' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Previous Arrow */}
          <button
            type="button"
            onClick={() => selectCardIndex(activeIndex - 1)}
            aria-label="اللعبة السابقة"
            className="hidden md:flex absolute right-4 lg:right-8 z-40 w-12 h-12 rounded-full bg-white text-[#0A0A0A] border-[3px] border-[#0A0A0A] items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          >
            <ChevronRight className="w-6 h-6 stroke-[2.75]" />
          </button>

          {/* Next Arrow */}
          <button
            type="button"
            onClick={() => selectCardIndex(activeIndex + 1)}
            aria-label="اللعبة التالية"
            className="hidden md:flex absolute left-4 lg:left-8 z-40 w-12 h-12 rounded-full bg-white text-[#0A0A0A] border-[3px] border-[#0A0A0A] items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.75]" />
          </button>

          {/* Cards Deck */}
          {SHABAH_GAMES.map((game, idx) => {
            const offset = getRelativeOffset(idx);
            const isCenter = offset === 0;
            const isRight = offset === -1;
            const isLeft = offset === 1;

            let transformStyle = 'perspective(1000px) translateX(0%) scale(0.7) translateZ(-200px)';
            let zIndexClass = 'z-10';
            let opacityStyle = 0;
            let filterStyle = 'none';
            let pointerEventsClass = 'pointer-events-none';

            // Requirement 4: Center card is fully illuminated (brightness-100, opacity-100).
            // Side cards are explicitly dimmed (brightness-40, opacity-35, scale-85).
            if (isCenter) {
              transformStyle = 'perspective(1000px) translateX(0%) scale(1) rotateY(0deg) translateZ(0px)';
              zIndexClass = 'z-30';
              opacityStyle = 1;
              filterStyle = 'brightness(1)';
              pointerEventsClass = 'pointer-events-auto';
            } else if (isRight) {
              transformStyle = 'perspective(1000px) translateX(55%) scale(0.85) rotateY(-32deg)';
              zIndexClass = 'z-20';
              opacityStyle = 0.35;
              filterStyle = 'brightness(0.4)';
              pointerEventsClass = 'pointer-events-auto cursor-pointer';
            } else if (isLeft) {
              transformStyle = 'perspective(1000px) translateX(-55%) scale(0.85) rotateY(32deg)';
              zIndexClass = 'z-20';
              opacityStyle = 0.35;
              filterStyle = 'brightness(0.4)';
              pointerEventsClass = 'pointer-events-auto cursor-pointer';
            }

            return (
              <div
                key={game.id}
                onClick={() => {
                  if (isCenter) {
                    openGameJoinModal(game);
                  } else {
                    selectCardIndex(idx);
                  }
                }}
                style={{
                  transform: transformStyle,
                  opacity: opacityStyle,
                  filter: filterStyle,
                  transformStyle: 'preserve-3d',
                }}
                className={`absolute transition-all duration-300 ease-out flex flex-col items-center ${zIndexClass} ${pointerEventsClass}`}
              >
                {/* Top Badge */}
                <div className="mb-2.5 shabah-pill-wrap">
                  <div className="shabah-pill-inner">
                    <div className="shabah-pill-surface px-5 py-1 text-xs sm:text-sm font-black text-[#0A0A0A]">
                      {game.badgeText}
                    </div>
                  </div>
                </div>

                {/* Card Container */}
                <div className="w-[285px] sm:w-[320px] h-[430px] sm:h-[460px] shabah-border-wrap">
                  <div className="shabah-border-inner">
                    <div className="shabah-surface p-5 flex flex-col justify-between h-full">
                      {/* Game Title */}
                      <h2 className="text-2xl sm:text-3xl font-black text-[#0A0A0A] text-center tracking-tight">
                        {game.title}
                      </h2>

                      {/* Illustration Frame */}
                      <div className="w-full flex-1 my-3 rounded-2xl bg-[#0A0A0A]/5 border-2 border-[#0A0A0A] overflow-hidden flex items-center justify-center">
                        <img
                          src={game.placeholderImage}
                          alt={game.title}
                          draggable={false}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Bottom Buttons: [العب] (Requirement 7: shabah-btn-black) and [شرح] */}
                      <div className="flex items-center gap-2.5 w-full">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isCenter) {
                              selectCardIndex(idx);
                              return;
                            }
                            openGameJoinModal(game);
                          }}
                          className="flex-1 py-3.5 rounded-xl text-white font-black text-lg shabah-btn-black cursor-pointer"
                        >
                          العب
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            sound.playClick();
                            setExplainedGame(game);
                          }}
                          className="px-4 py-3.5 rounded-xl bg-white text-[#0A0A0A] border-2 border-[#0A0A0A] font-black text-sm transition-transform duration-150 active:scale-[0.98] hover:bg-neutral-100 cursor-pointer"
                        >
                          شرح
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mt-2">
          {SHABAH_GAMES.map((game, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={game.id}
                type="button"
                aria-label={game.title}
                onClick={() => selectCardIndex(idx)}
                className={`h-2.5 rounded-full transition-all duration-200 cursor-pointer ${
                  isActive ? 'w-8 bg-white' : 'w-2.5 bg-neutral-700 hover:bg-neutral-500'
                }`}
              />
            );
          })}
        </div>
      </section>

      {/* Compact Room Code Box */}
      <section className="w-full mt-4 px-4 relative z-20">
        <div className="max-w-md w-[92%] mx-auto shabah-border-wrap">
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
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="اكتب الكود هنا..."
                  maxLength={6}
                  className="flex-1 h-12 px-4 rounded-xl bg-white border-2 border-[#0A0A0A] text-[#0A0A0A] placeholder-neutral-400 text-center font-black tracking-widest uppercase focus:outline-none"
                />

                <button
                  type="submit"
                  className="h-12 px-6 rounded-xl font-black shabah-btn-black cursor-pointer shrink-0"
                >
                  دخول
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
      </section>

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
