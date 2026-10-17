export interface AvatarItem {
  id: string;
  name: string;
  iconName: string; // Lucide icon
  bgTone: string;   // Tactile brutalist color token
}

export const AVATARS_POOL: AvatarItem[] = [
  { id: 'wolf', name: 'الذيب', iconName: 'Flame', bgTone: '#EAD7BB' },
  { id: 'driver', name: 'الطارة', iconName: 'Car', bgTone: '#D4E2D4' },
  { id: 'owl', name: 'الساهر', iconName: 'Moon', bgTone: '#DFD3C3' },
  { id: 'sniper', name: 'القناص', iconName: 'Crosshair', bgTone: '#CCD5AE' },
  { id: 'chaos', name: 'النكبة', iconName: 'Bomb', bgTone: '#FCD5CE' },
  { id: 'falcon', name: 'الصقر', iconName: 'Feather', bgTone: '#E8E8E4' },
  { id: 'captain', name: 'الكابتن', iconName: 'Compass', bgTone: '#D8E2DC' },
  { id: 'boss', name: 'الزعيم', iconName: 'Crown', bgTone: '#FFE5D9' },
  { id: 'tycoon', name: 'الهامور', iconName: 'Fish', bgTone: '#C9E4DE' },
  { id: 'ghost', name: 'الشبح', iconName: 'Ghost', bgTone: '#E2ECE9' },
  { id: 'professor', name: 'البروفيسور', iconName: 'Glasses', bgTone: '#E5D4C0' },
  { id: 'colonel', name: 'العقيد', iconName: 'Shield', bgTone: '#D6E2E9' }
];

export const getAvatarById = (avatarId: string): AvatarItem => {
  return AVATARS_POOL.find(a => a.id === avatarId) || {
    id: avatarId,
    name: 'مشتبه',
    iconName: 'User',
    bgTone: '#E5E0D5'
  };
};
