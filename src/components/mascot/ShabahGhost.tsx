import React, { useEffect, useId, useRef, useState } from 'react';

export type ShabahMood = 'idle' | 'angry' | 'happy' | 'judging' | 'surprised';

export interface ShabahGhostProps {
  mood?: ShabahMood;
  className?: string;
  /** Optional explicit horizontal gaze offset (-6 to +6) */
  lookX?: number;
  /** Optional explicit vertical gaze offset (-4 to +4) */
  lookY?: number;
  /** Optional explicit gaze offset object */
  gazeOffset?: { x: number; y: number } | null;
  /** Whether to track pointer/touch globally across the screen (default: true) */
  trackPointer?: boolean;
  onClick?: () => void;
}

const GHOST_BODY_PATH =
  'M 60 14 C 85 14, 96 32, 96 58 C 96 76, 99 91, 98 102 C 97 110, 89 112, 83 106 C 78 101, 74 101, 70 106 C 65 112, 55 112, 50 106 C 46 101, 42 101, 37 106 C 31 112, 23 110, 22 102 C 21 91, 24 76, 24 58 C 24 32, 35 14, 60 14 Z';

export const ShabahGhost: React.FC<ShabahGhostProps> = ({
  mood = 'idle',
  className = 'w-44 h-44',
  lookX,
  lookY,
  gazeOffset,
  trackPointer = true,
  onClick,
}) => {
  const uid = useId().replace(/:/g, '');
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [pointerOffset, setPointerOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);

  // Natural Blink: scaleY to 0.08 for 110ms every 5 seconds
  useEffect(() => {
    let blinkTimeout: ReturnType<typeof setTimeout> | null = null;
    const interval = setInterval(() => {
      setIsBlinking(true);
      blinkTimeout = setTimeout(() => {
        setIsBlinking(false);
      }, 110);
    }, 5000);

    return () => {
      clearInterval(interval);
      if (blinkTimeout) clearTimeout(blinkTimeout);
    };
  }, []);

  // Eye Tracking: ±6px horizontally, ±4px vertically following cursor/touch
  useEffect(() => {
    if (!trackPointer) return;

    const updateGaze = (clientX: number, clientY: number) => {
      const el = svgRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = clientX - centerX;
      const dy = clientY - centerY;

      const maxDistX = Math.max(window.innerWidth * 0.45, 180);
      const maxDistY = Math.max(window.innerHeight * 0.45, 180);

      const clampedX = Math.max(-6, Math.min(6, (dx / maxDistX) * 6));
      const clampedY = Math.max(-4, Math.min(4, (dy / maxDistY) * 4));

      setPointerOffset({ x: clampedX, y: clampedY });
    };

    const handleMouseMove = (e: MouseEvent) => {
      updateGaze(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        updateGaze(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchstart', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchMove);
    };
  }, [trackPointer]);

  const explicitX = lookX !== undefined ? lookX : (gazeOffset ? gazeOffset.x : undefined);
  const explicitY = lookY !== undefined ? lookY : (gazeOffset ? gazeOffset.y : undefined);
  const finalX = Math.max(-6, Math.min(6, explicitX !== undefined ? explicitX : pointerOffset.x));
  const finalY = Math.max(-4, Math.min(4, explicitY !== undefined ? explicitY : pointerOffset.y));

  const renderEyes = () => {
    switch (mood) {
      case 'angry':
        // Both eyes tilt inward aggressively (rotate(22deg) / rotate(-22deg)) with a sharp upper eyelid cut
        return (
          <g>
            {/* Left Eye (tilted inward 22deg with upper slash cut) */}
            <g transform="translate(46, 52) rotate(22)">
              <path
                d="M -6 -2 L 6 -2 C 6.5 5, 4 9, 0 9 C -4 9, -6.5 5, -6 -2 Z"
                fill="#111111"
              />
            </g>
            {/* Right Eye (tilted inward -22deg with upper slash cut) */}
            <g transform="translate(74, 52) rotate(-22)">
              <path
                d="M -6 -2 L 6 -2 C 6.5 5, 4 9, 0 9 C -4 9, -6.5 5, -6 -2 Z"
                fill="#111111"
              />
            </g>
          </g>
        );

      case 'happy':
        // Eyes morph into joyful upward curved crescent arcs (⌒ ⌒)
        return (
          <g>
            <path
              d="M 39.5 54.5 Q 46.5 43.5 53.5 54.5"
              fill="none"
              stroke="#111111"
              strokeWidth="4.8"
              strokeLinecap="round"
            />
            <path
              d="M 66.5 54.5 Q 73.5 43.5 80.5 54.5"
              fill="none"
              stroke="#111111"
              strokeWidth="4.8"
              strokeLinecap="round"
            />
          </g>
        );

      case 'judging':
        // One eye squints into a narrow horizontal line while the other widens
        return (
          <g>
            {/* Left Eye: narrow horizontal squint */}
            <rect
              x="39.5"
              y="50"
              width="13"
              height="4.4"
              rx="2.2"
              fill="#111111"
            />
            {/* Right Eye: wide investigating oval */}
            <ellipse
              cx="73.5"
              cy="51.5"
              rx="6.2"
              ry="9.6"
              fill="#111111"
            />
          </g>
        );

      case 'surprised':
        // Both eyes widen into large round circles
        return (
          <g>
            <ellipse cx="46.5" cy="51.5" rx="7.2" ry="7.6" fill="#111111" />
            <ellipse cx="73.5" cy="51.5" rx="7.2" ry="7.6" fill="#111111" />
          </g>
        );

      case 'idle':
      default:
        // Two clean vertical ovals
        return (
          <g>
            <ellipse cx="46.5" cy="51.5" rx="5.3" ry="8.6" fill="#111111" />
            <ellipse cx="73.5" cy="51.5" rx="5.3" ry="8.6" fill="#111111" />
          </g>
        );
    }
  };

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 120 126"
      className={`select-none overflow-visible ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      role="img"
      aria-label="شبح"
    >
      <defs>
        <linearGradient id={`shabahGrad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#B56BFF" />
          <stop offset="28%" stopColor="#6366F1" />
          <stop offset="52%" stopColor="#38BDF8" />
          <stop offset="78%" stopColor="#4ADE80" />
          <stop offset="100%" stopColor="#BEF264" />
        </linearGradient>
      </defs>

      {/* 1. Outer Iridescent Gradient Ring */}
      <path
        d={GHOST_BODY_PATH}
        fill="none"
        stroke={`url(#shabahGrad-${uid})`}
        strokeWidth="17"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 2. Middle Thick Dark Stroke Ring (#0A0A0A) */}
      <path
        d={GHOST_BODY_PATH}
        fill="#0A0A0A"
        stroke="#0A0A0A"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 3. Inner Pure Crisp White Body (#FFFFFF) — Strictly NO MOUTH */}
      <path d={GHOST_BODY_PATH} fill="#FFFFFF" />

      {/* 4. Eye-Only Emotion & Gaze Tracking Layer */}
      <g
        style={{
          transform: `translate3d(${finalX}px, ${finalY}px, 0)`,
          transition: 'transform 140ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <g
          style={{
            transformOrigin: '60px 52px',
            transform: isBlinking ? 'scaleY(0.08)' : 'scaleY(1)',
            transition: 'transform 85ms ease-in-out',
          }}
        >
          {renderEyes()}
        </g>
      </g>
    </svg>
  );
};

export default ShabahGhost;
