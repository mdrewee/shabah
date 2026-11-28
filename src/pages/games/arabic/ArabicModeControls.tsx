import { useState } from 'react';
import { Grid3X3, Shuffle } from 'lucide-react';
import { LobbyModePicker } from '../../../components/lobby/LobbyModePicker';
import { roomBus } from '../../../lib/roomBus';
import { sound } from '../../../lib/audio';
import type { ArabicMode, useLetterRush } from './useLetterRush';

const ARABIC_MODES = [
  { id: 'random-letter', label: 'حرف عشوائي', icon: Shuffle },
  { id: 'letter-rush', label: 'ضغط الحروف', icon: Grid3X3 },
] as const;

export function useArabicModeControls({ roomCode, host, playerId, getPlayers, letterRush, onLetterRushLaunch }: {
  roomCode: string;
  host: boolean;
  playerId: string;
  getPlayers: () => string[];
  letterRush: ReturnType<typeof useLetterRush>;
  onLetterRushLaunch?: (launching: boolean) => void;
}) {
  const { board, available, error, call, configureMode } = letterRush;
  const [starting, setStarting] = useState<ArabicMode>();
  const [startError, setStartError] = useState('');
  const [configuring, setConfiguring] = useState(false);
  const [selected, setSelected] = useState<ArabicMode>();

  const selectMode = async (mode: ArabicMode) => {
    if (!host || starting || configuring) return;
    sound.playClick();
    setStartError('');
    if (!available && mode === 'letter-rush') {
      setStartError('هذا الطور يتطلب تحديث خادم الغرف.');
      return;
    }
    setConfiguring(true);
    try {
      if (!available || await configureMode(mode) || (mode === 'random-letter' && !board)) setSelected(mode);
    } catch {
      setStartError('تعذر حفظ اختيار الطور. حاول مرة ثانية.');
    } finally {
      setConfiguring(false);
    }
  };

  const startMode = async (mode: ArabicMode) => {
    if (!host || starting || configuring) return;
    sound.playClick();
    setStartError('');
    const roster = [...new Set([...getPlayers(), ...(mode === 'letter-rush' ? [playerId] : [])])];
    if (roster.length < 2 || roster.length > 10) {
      setStartError(roster.length < 2 ? 'نحتاج لاعبين على الأقل. شارك رابط الغرفة عشان تبدأ.' : 'الحد الأقصى ١٠ لاعبين.');
      return;
    }
    setStarting(mode);
    try {
      if (mode === 'letter-rush') {
        const { LETTER_RUSH_QUESTIONS } = await import('../../../data/letterRushQuestions');
        onLetterRushLaunch?.(true);
        if (!await call('start', { questions: LETTER_RUSH_QUESTIONS, roster })) onLetterRushLaunch?.(false);
      } else if (!await roomBus.broadcastGameStarted(roomCode, {
        startedAt: Date.now(), gameId: 'ai-arabic', gameTitle: 'الشبح العربي', roomCode,
      })) {
        setStartError('تعذر بدء حرف عشوائي. حاول مرة ثانية.');
      }
    } catch {
      onLetterRushLaunch?.(false);
      setStartError('تعذر بدء الطور. حاول مرة ثانية.');
    } finally {
      setStarting(undefined);
    }
  };

  const cards = <section dir="rtl" className="grid gap-2" aria-label="أطوار الشبح العربي">
    <LobbyModePicker<ArabicMode> modes={ARABIC_MODES} selected={host ? selected : board?.mode}
      onSelect={host ? mode => void selectMode(mode) : undefined}
      disabled={Boolean(starting) || configuring} />
    {starting && <p role="status" className="text-sm">جاري بدء الجولة…</p>}
    {(startError || error) && <p role="alert" className="text-sm text-red-700">{startError || error}</p>}
  </section>;
  return { cards, manualStart: { disabled: !selected || configuring || Boolean(starting), onStart: () => { if (selected) void startMode(selected); } } };
}
