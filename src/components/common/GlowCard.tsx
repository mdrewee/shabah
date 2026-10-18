import React, { useRef, useState, useCallback } from 'react';

export type GlowColor = 'purple' | 'green' | 'orange' | 'blue' | 'red';

export interface GlowCardProps {
  glowColor?: GlowColor;
  customSize?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  isActive?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const GLOW_PALETTES: Record<
  GlowColor,
  {
    spotlight: string;
    ambient: string;
    border: string;
    halo: string;
  }
> = {
  purple: {
    spotlight: 'rgba(181, 107, 255, 0.38)',
    ambient: 'rgba(181, 107, 255, 0.12)',
    border: 'rgba(181, 107, 255, 0.70)',
    halo: 'rgba(181, 107, 255, 0.28)',
  },
  green: {
    spotlight: 'rgba(74, 222, 128, 0.38)',
    ambient: 'rgba(74, 222, 128, 0.12)',
    border: 'rgba(74, 222, 128, 0.70)',
    halo: 'rgba(74, 222, 128, 0.28)',
  },
  orange: {
    spotlight: 'rgba(251, 146, 60, 0.38)',
    ambient: 'rgba(251, 146, 60, 0.12)',
    border: 'rgba(251, 146, 60, 0.70)',
    halo: 'rgba(251, 146, 60, 0.28)',
  },
  blue: {
    spotlight: 'rgba(56, 189, 248, 0.38)',
    ambient: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.70)',
    halo: 'rgba(56, 189, 248, 0.28)',
  },
  red: {
    spotlight: 'rgba(248, 113, 113, 0.38)',
    ambient: 'rgba(248, 113, 113, 0.12)',
    border: 'rgba(248, 113, 113, 0.70)',
    halo: 'rgba(248, 113, 113, 0.28)',
  },
};

export const GlowCard: React.FC<GlowCardProps> = ({
  glowColor = 'purple',
  customSize = false,
  className = '',
  style = {},
  children,
  isActive = true,
  onClick,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 160, y: 180 });
  const [isHovered, setIsHovered] = useState(false);

  const palette = GLOW_PALETTES[glowColor] || GLOW_PALETTES.purple;

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isActive) return;
      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsHovered(true);
    },
    [isActive]
  );

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const sizeClasses = customSize
    ? ''
    : 'w-[285px] sm:w-[325px] h-[440px] sm:h-[470px] select-none flex flex-col justify-between';

  // Dynamic border gradient reacting to pointer
  const borderBackground = isActive
    ? isHovered
      ? `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, ${palette.border}, rgba(255, 255, 255, 0.14) 40%, rgba(255, 255, 255, 0.06) 100%)`
      : `radial-gradient(380px circle at 50% 25%, ${palette.border}, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0.05) 100%)`
    : 'rgba(255, 255, 255, 0.08)';

  // Spotlight cone inside surface
  const spotlightBackground = isActive
    ? `radial-gradient(420px circle at ${mousePos.x}px ${mousePos.y}px, ${palette.spotlight}, ${palette.ambient} 38%, transparent 72%)`
    : 'none';

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        touchAction: 'pan-y',
        background: borderBackground,
        boxShadow: isActive ? `0 12px 48px -12px ${palette.halo}` : 'none',
        ...style,
      }}
      className={`relative p-[2px] rounded-[30px] transition-all duration-300 ${sizeClasses} ${className}`}
    >
      {/* Inner Surface */}
      <div className="relative w-full h-full rounded-[28px] bg-[#0A0A0A] overflow-hidden flex flex-col justify-between p-5 sm:p-6 border border-white/5">
        {/* Interactive Spotlight Cone Overlay */}
        {isActive && (
          <div
            className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
            style={{
              background: spotlightBackground,
              opacity: isHovered ? 1 : 0.55,
            }}
          />
        )}

        {/* Ambient Top Glow Accent */}
        {isActive && (
          <div
            className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 rounded-full blur-2xl z-0"
            style={{ background: palette.ambient }}
          />
        )}

        {/* Card Content (Elevated above spotlight) */}
        <div className="relative z-10 w-full h-full flex flex-col justify-between">
          {children}
        </div>
      </div>
    </div>
  );
};
