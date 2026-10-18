import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { ShabahGame, SHABAH_GAMES } from '../../data/shabahGames';
import { GlowCard } from './GlowCard';
import { sound } from '../../lib/audio';

export interface CoverflowCarouselProps {
  games?: ShabahGame[];
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  onPlayGame: (game: ShabahGame) => void;
  onExplainGame: (game: ShabahGame) => void;
}

export const CoverflowCarousel: React.FC<CoverflowCarouselProps> = ({
  games = SHABAH_GAMES,
  activeIndex: externalIndex,
  onActiveIndexChange,
  onPlayGame,
  onExplainGame,
}) => {
  const [internalIndex, setInternalIndex] = useState(0);
  const activeIndex = externalIndex !== undefined ? externalIndex : internalIndex;

  const carouselContainerRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(activeIndex);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const selectCardIndex = useCallback(
    (nextIdx: number) => {
      const total = games.length;
      const normalized = ((nextIdx % total) + total) % total;
      if (normalized === activeIndexRef.current) return;

      sound.playTick();
      if (onActiveIndexChange) {
        onActiveIndexChange(normalized);
      } else {
        setInternalIndex(normalized);
      }
    },
    [games.length, onActiveIndexChange]
  );

  // Non-passive Touch isolation for Coverflow
  useEffect(() => {
    const el = carouselContainerRef.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;
    let deltaX = 0;
    let isHorizontal = false;

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      deltaX = 0;
      isHorizontal = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      const curX = e.touches[0].clientX;
      const curY = e.touches[0].clientY;
      const dx = curX - startX;
      const dy = curY - startY;
      deltaX = dx;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (absX > absY && absX > 6) {
        isHorizontal = true;
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    const onTouchEnd = () => {
      if (isHorizontal && Math.abs(deltaX) > 35) {
        if (deltaX > 0) {
          selectCardIndex(activeIndexRef.current + 1);
        } else {
          selectCardIndex(activeIndexRef.current - 1);
        }
      }
      startX = 0;
      startY = 0;
      deltaX = 0;
      isHorizontal = false;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [selectCardIndex]);

  const getRelativeOffset = (index: number) => {
    const total = games.length;
    let diff = index - activeIndex;
    while (diff > total / 2) diff -= total;
    while (diff < -total / 2) diff += total;
    return diff;
  };

  return (
    <div className="w-full flex flex-col items-center select-none">
      <div
        ref={carouselContainerRef}
        className="relative w-full h-[500px] sm:h-[535px] flex items-center justify-center select-none touch-pan-y"
        style={{ perspective: '1000px', touchAction: 'pan-y' }}
      >
        {/* Previous Arrow (Right in RTL) */}
        <button
          type="button"
          onClick={() => selectCardIndex(activeIndex - 1)}
          aria-label="اللعبة السابقة"
          className="hidden md:flex absolute right-4 lg:right-8 z-40 w-12 h-12 rounded-full bg-white text-[#0A0A0A] border-[3px] border-[#0A0A0A] items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
        >
          <ChevronRight className="w-6 h-6 stroke-[2.75]" />
        </button>

        {/* Next Arrow (Left in RTL) */}
        <button
          type="button"
          onClick={() => selectCardIndex(activeIndex + 1)}
          aria-label="اللعبة التالية"
          className="hidden md:flex absolute left-4 lg:left-8 z-40 w-12 h-12 rounded-full bg-white text-[#0A0A0A] border-[3px] border-[#0A0A0A] items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.75]" />
        </button>

        {/* Cards Deck */}
        {games.map((game, idx) => {
          const offset = getRelativeOffset(idx);
          const isCenter = offset === 0;
          const isRight = offset === -1;
          const isLeft = offset === 1;

          let transformStyle = 'perspective(1000px) translateX(0%) scale(0.7) translateZ(-200px)';
          let zIndexClass = 'z-0';
          let opacityStyle = 0;
          let filterStyle = 'none';
          let pointerEventsClass = 'pointer-events-none';

          if (isCenter) {
            transformStyle = 'perspective(1000px) translateX(0%) scale(1) rotateY(0deg) translateZ(0px)';
            zIndexClass = 'z-30';
            opacityStyle = 1;
            filterStyle = 'brightness(1)';
            pointerEventsClass = 'pointer-events-auto';
          } else if (isRight) {
            transformStyle = 'perspective(1000px) translateX(55%) scale(0.85) rotateY(-32deg) translateZ(-60px)';
            zIndexClass = 'z-10';
            opacityStyle = 0.35;
            filterStyle = 'brightness(0.4)';
            pointerEventsClass = 'pointer-events-auto cursor-pointer';
          } else if (isLeft) {
            transformStyle = 'perspective(1000px) translateX(-55%) scale(0.85) rotateY(32deg) translateZ(-60px)';
            zIndexClass = 'z-10';
            opacityStyle = 0.35;
            filterStyle = 'brightness(0.4)';
            pointerEventsClass = 'pointer-events-auto cursor-pointer';
          }

          return (
            <div
              key={game.id}
              onClick={() => {
                if (isCenter) {
                  onPlayGame(game);
                } else {
                  selectCardIndex(idx);
                }
              }}
              style={{
                transform: transformStyle,
                opacity: opacityStyle,
                filter: filterStyle,
                transformStyle: 'preserve-3d',
                touchAction: 'pan-y',
              }}
              className={`absolute transition-all duration-300 ease-out flex flex-col items-center ${zIndexClass} ${pointerEventsClass}`}
            >
              <GlowCard
                glowColor={game.glowColor}
                customSize={true}
                isActive={isCenter}
                className="w-[285px] sm:w-[325px] h-[440px] sm:h-[470px] select-none flex flex-col justify-between"
                style={{ touchAction: 'pan-y' }}
              >
                {/* أعلى الكرت: الشكل البيضاوي البارز (شكل كبسولة أنيق يحتوي على badgeText) */}
                <div className="flex justify-center w-full">
                  <div className="shabah-pill-wrap">
                    <div className="shabah-pill-inner">
                      <div className="shabah-pill-surface px-5 py-1 text-xs sm:text-sm font-black text-[#0A0A0A] select-none">
                        {game.badgeText}
                      </div>
                    </div>
                  </div>
                </div>

                {/* اسم اللعبة: بخط الموقع العريض */}
                <h2 className="font-game font-black text-2xl sm:text-3xl text-white text-center mt-1 tracking-tight select-none">
                  {game.title}
                </h2>

                {/* مساحة الصورة بالمنتصف: إطار مخصص للصورة */}
                <div className="w-full flex-1 my-3 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center relative p-3">
                  <img
                    src={game.placeholderImage}
                    alt={game.title}
                    draggable={false}
                    className="w-full h-full object-contain max-h-[180px] drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] select-none"
                  />
                </div>

                {/* شريط الأزرار السفلي (أفقي) */}
                <div className="flex items-center gap-2.5 w-full mt-auto">
                  {/* زر [العب]: يأخذ المساحة الأكبر، هوفر تدرج شبح، كليك يفتح المودال */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isCenter) {
                        selectCardIndex(idx);
                        return;
                      }
                      onPlayGame(game);
                    }}
                    className="flex-1 py-3.5 rounded-xl bg-white text-[#0A0A0A] font-black text-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-[#B56BFF] hover:via-[#38BDF8] hover:to-[#BEF264] hover:text-[#0A0A0A] hover:shadow-[0_0_20px_rgba(181,107,255,0.45)] active:scale-[0.98] cursor-pointer"
                  >
                    العب
                  </button>

                  {/* زر [شرح]: بجانبه مباشرة، يفتح المودال لعرض shortExplanation */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      sound.playClick();
                      onExplainGame(game);
                    }}
                    className="px-4 py-3.5 rounded-xl border border-white/20 bg-white/10 text-white font-black text-sm hover:bg-white/20 active:scale-[0.98] transition-colors cursor-pointer"
                  >
                    شرح
                  </button>
                </div>
              </GlowCard>
            </div>
          );
        })}
      </div>

      {/* مؤشرات التنقل (Dots) */}
      <div className="flex items-center justify-center gap-2 mt-2">
        {games.map((game, idx) => {
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
    </div>
  );
};
