import React from 'react';
import { Crown, Gem, Sparkles, Circle, Copy, X } from 'lucide-react';
import type { FlyingTier } from './types';

export const FLYING_RARITY = {
  common: { label: 'شائع', power: 1, color: '#94a3b8', icon: Circle },
  uncommon: { label: 'غير شائع', power: 2, color: '#60a5fa', icon: Sparkles },
  rare: { label: 'نادر', power: 3, color: '#22d3ee', icon: Gem },
  legendary: { label: 'أسطوري', power: 4, color: '#fbbf24', icon: Crown },
  duplicated: { label: 'مكرر', power: 0, color: '#fb923c', icon: Copy },
  failed: { label: 'خاطئ', power: 0, color: '#f87171', icon: X },
} as const;

export function RarityBadge({ tier }: { tier: FlyingTier }) {
  const info = FLYING_RARITY[tier];
  const Icon = info.icon;
  return <div aria-label={`ندرة الإجابة: ${info.label}`} className="flex items-center justify-center gap-2 rounded-xl border-2 bg-zinc-950 px-2.5 py-2 text-xs font-black"
    style={{ color: info.color, borderColor: info.color, boxShadow: info.power >= 3 ? `0 0 22px ${info.color}66` : undefined }}>
    <Icon aria-hidden="true" size={info.power === 4 ? 24 : 19} />
    <span>{info.label}</span>
    {info.power > 0 && <span aria-hidden="true" className="flex items-end gap-0.5">{[1, 2, 3, 4].map((level) =>
      <i key={level} className="w-1.5 rounded-sm" style={{ height: 5 + level * 3, background: level <= info.power ? info.color : '#334155' }} />)}</span>}
  </div>;
}
