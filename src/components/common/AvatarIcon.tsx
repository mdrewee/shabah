import React from 'react';
import { Coffee, Palmtree, Sword, Bird, CircleDot, Tent, Compass, Sparkles } from 'lucide-react';
import { AvatarId } from '../../types/game';
import { AVATAR_PRESETS } from '../../lib/gamesCatalog';

interface AvatarIconProps {
  avatarId: AvatarId;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
}

export const AvatarIcon: React.FC<AvatarIconProps> = ({
  avatarId,
  size = 'md',
  className = '',
  showBorder = true,
}) => {
  const preset = AVATAR_PRESETS.find((p) => p.id === avatarId) || AVATAR_PRESETS[0];

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-lg',
  }[size];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
    xl: 'w-10 h-10',
  }[size];

  const renderIcon = () => {
    switch (avatarId) {
      case 'dallah':
        return <Coffee className={iconSizes} strokeWidth={2.2} />;
      case 'finjan':
        // Finjan cup icon
        return (
          <svg className={iconSizes} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 8h14v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8z" />
            <path d="M4 8h16" />
            <path d="M8 4h8" />
          </svg>
        );
      case 'palm':
        return <Palmtree className={iconSizes} strokeWidth={2.2} />;
      case 'sword':
        return <Sword className={iconSizes} strokeWidth={2.2} />;
      case 'falcon':
        return <Bird className={iconSizes} strokeWidth={2.2} />;
      case 'misbaha':
        return <CircleDot className={iconSizes} strokeWidth={2.2} />;
      case 'camel':
        return <Compass className={iconSizes} strokeWidth={2.2} />;
      case 'tent':
        return <Tent className={iconSizes} strokeWidth={2.2} />;
      default:
        return <Sparkles className={iconSizes} strokeWidth={2.2} />;
    }
  };

  return (
    <div
      className={`inline-flex items-center justify-center rounded-tactile ${preset.bg} ${preset.fg} ${sizeClasses} ${
        showBorder ? 'border-2 border-ink-950 shadow-tactile-sm' : ''
      } ${className}`}
      title={preset.name}
    >
      {renderIcon()}
    </div>
  );
};
