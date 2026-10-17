import React from 'react';

interface ShabahWordmarkProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ShabahWordmark: React.FC<ShabahWordmarkProps> = ({
  className = '',
  size = 'xl',
}) => {
  // Exact size tiers
  const sizeStyles = {
    sm: {
      fontSize: 'clamp(1.75rem, 5vw, 2.25rem)',
      strokeWidth: '4px',
    },
    md: {
      fontSize: 'clamp(2.5rem, 7vw, 3.5rem)',
      strokeWidth: '6px',
    },
    lg: {
      fontSize: 'clamp(3.5rem, 10vw, 5rem)',
      strokeWidth: '7px',
    },
    xl: {
      fontSize: 'clamp(4.25rem, 14vw, 7.5rem)',
      strokeWidth: '8px',
    },
  }[size];

  return (
    <div
      className={`inline-flex items-center justify-center select-none overflow-visible ${className}`}
      style={{
        overflow: 'visible',
        paddingBottom: '0.35em',
        lineHeight: 1.4,
      }}
    >
      <span
        className="font-game font-black text-white tracking-normal"
        style={{
          fontSize: sizeStyles.fontSize,
          WebkitTextStroke: `${sizeStyles.strokeWidth} #000000`,
          paintOrder: 'stroke fill',
          filter:
            'drop-shadow(0px 0px 1px #B56BFF) drop-shadow(2px 2px 0px #38BDF8) drop-shadow(-2px -2px 0px #BEF264)',
          overflow: 'visible',
          display: 'inline-block',
          paddingBottom: '0.2em',
          lineHeight: 1.35,
        }}
        aria-label="شبح"
      >
        شبح
      </span>
    </div>
  );
};
