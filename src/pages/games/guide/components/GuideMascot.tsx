import React from 'react';
import { ShabahGhost, ShabahMood } from '../../../../components/mascot/ShabahGhost';

interface GuideMascotProps {
  mood?: 'curious' | 'focused' | 'idle' | ShabahMood;
  className?: string;
  size?: number;
}

/**
 * Authentic Shabah Ghost Mascot with iconic iridescent gradient border,
 * thick brutalist stroke, and dynamic eye expressions.
 */
export const GuideMascot: React.FC<GuideMascotProps> = ({
  mood = 'idle',
  className = 'w-36 h-44',
}) => {
  const ghostMood: ShabahMood =
    mood === 'curious'
      ? 'judging'
      : mood === 'focused'
      ? 'surprised'
      : (mood as ShabahMood) || 'idle';

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <ShabahGhost mood={ghostMood} className="w-full h-full" trackPointer={true} />
    </div>
  );
};

export default GuideMascot;
