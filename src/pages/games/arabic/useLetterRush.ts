import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export const LETTERS = [...'ابتثجحخدذرزسشصضطظعغفقكلمنهوي'];
export type ArabicMode = 'random-letter' | 'letter-rush';
export const LETTER_RUSH_TURN_OPTIONS = [5, 8, 12] as const;
export type LetterRushDuration = (typeof LETTER_RUSH_TURN_OPTIONS)[number];
export type LetterPlayer = { id: string; name: string; score: number; alive: boolean };
export type LetterBoard = {
  version: number;
  serverNow: number;
  mode: ArabicMode;
  phase: 'lobby' | 'preview' | 'turn' | 'ruling' | 'review' | 'between' | 'final' | 'ended';
  duration: LetterRushDuration;
  players?: LetterPlayer[];
  round?: number;
  turn?: string;
  judge?: string;
  question?: string;
  used?: string[];
  letter?: string | null;
  paused?: number | null;
  endsAt?: number | null;
  serial?: number;
  winner?: string;
  lastOut?: string | null;
  event?: { kind: 'correct' | 'wrong' | 'skip'; player: string; letter?: string; at: number; serial: number } | null;
};
type WireBoard = Omit<LetterBoard, 'mode'> & { mode?: 'classic' | 'letter' };
type Participant = { id: string; name: string };
type Action = 'configure' | 'start' | 'lobby' | 'tick' | 'letter' | 'correct' | 'wrong' | 'pause_edit' | 'resume_edit'
  | 'kick' | 'restore' | 'finish' | 'restore_final';

let deviceKey: string | undefined;
function deviceToken() {
  if (deviceKey) return deviceKey;
  try {
    const saved = localStorage.getItem('shabah_letter_device');
    if (saved && /^[a-f0-9]{64}$/.test(saved)) return (deviceKey = saved);
  } catch {}
  deviceKey = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
  try { localStorage.setItem('shabah_letter_device', deviceKey); } catch {}
  return deviceKey;
}

export function rankLetterPlayers(players: LetterPlayer[]) {
  const ordered = [...players].sort((a, b) => b.score - a.score);
  return ordered.map(player => ({ ...player, place: ordered.findIndex(other => other.score === player.score) + 1 }));
}

export function useLetterRush(code: string, participant?: Participant) {
  const playerId = participant?.id;
  const playerName = participant?.name;
  const [board, setBoard] = useState<LetterBoard | null>();
  const [available, setAvailable] = useState(true);
  const [error, setError] = useState('');
  const latest = useRef<LetterBoard | null>(null);
  const offset = useRef(0);
  const readInFlight = useRef<Promise<void> | null>(null);
  const invalidated = useRef(0);

  const accept = useCallback((snapshot: WireBoard | null, sent: number) => {
    if (!snapshot) return;
    // The deployed RPC and saved rooms use these values on the wire.
    const next: LetterBoard = { ...snapshot, mode: snapshot.mode === 'letter' ? 'letter-rush' : 'random-letter' };
    if (latest.current && next.version < latest.current.version) return;
    if (!latest.current || next.version > latest.current.version || Date.now() - sent < 1500) {
      offset.current = next.serverNow - (sent + Date.now()) / 2;
    }
    if (latest.current?.version === next.version) return;
    latest.current = next;
    setBoard(next);
  }, []);

  const refresh = useCallback((): Promise<void> => {
    const requested = ++invalidated.current;
    if (readInFlight.current) return readInFlight.current;
    const work = async () => {
      const sent = Date.now();
      const { data, error: failure } = await supabase.rpc('read_ghost_letter', { code })
        .abortSignal(AbortSignal.timeout(7000));
      if (failure) {
        if (failure.code === 'PGRST202' || failure.code === '42883') {
          setAvailable(false);
          setBoard(previous => previous ?? null);
        } else {
          setError('تعذر تحديث حالة الجولة. تحقق من الاتصال.');
        }
      } else {
        accept(data, sent);
        setAvailable(true);
        setError('');
        setBoard(previous => previous ?? null);
      }
    };
    const promise = work().finally(() => {
      readInFlight.current = null;
      if (requested !== invalidated.current) void refresh();
    });
    readInFlight.current = promise;
    return promise;
  }, [accept, code]);

  useEffect(() => {
    if (!/^[A-HJ-NP-Z2-9]{4}$/.test(code)) return;
    const channel = supabase.channel('shabah-letter:' + code)
      .on('broadcast', { event: 'letter_state' }, () => { void refresh(); })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') void refresh();
      });
    const recover = () => { if (!document.hidden) void refresh(); };
    document.addEventListener('visibilitychange', recover);
    window.addEventListener('online', recover);
    void refresh();
    return () => {
      document.removeEventListener('visibilitychange', recover);
      window.removeEventListener('online', recover);
      void supabase.removeChannel(channel);
    };
  }, [code, refresh]);

  const enrolled = useRef<Promise<boolean> | null>(null);
  const register = useCallback(() => {
    if (!playerId || !playerName || !available) return Promise.resolve(false);
    if (!enrolled.current) {
      const sent = Date.now();
      enrolled.current = Promise.resolve(supabase.rpc('play_ghost_letter', {
        code, player: playerId, device: deviceToken(), action: 'register', body: { name: [...playerName].slice(0, 18).join('') },
      }).abortSignal(AbortSignal.timeout(7000))).then(({ error: failure, data }) => {
        if (failure) {
          enrolled.current = null;
          return false;
        }
        accept(data, sent);
        return true;
      });
    }
    return enrolled.current;
  }, [accept, available, code, playerId, playerName]);

  useEffect(() => {
    if (board !== undefined && available) void register();
  }, [available, board === undefined, register]);

  const call = useCallback(async (action: Action, body: Record<string, unknown> = {}) => {
    if (!playerId || !available) return false;
    if ((action === 'configure' || action === 'start') && !await register()) {
      setError('تعذر تسجيل لاعب في الغرفة. تحقق من الاتصال.');
      return false;
    }
    const hostSecret = ['configure', 'start', 'lobby'].includes(action)
      ? localStorage.getItem('shabah_host_' + code) : undefined;
    const sent = Date.now();
    const { data, error: failure } = await supabase.rpc('play_ghost_letter', {
      code, player: playerId, device: deviceToken(), action, body: { ...body, hostSecret },
    }).abortSignal(AbortSignal.timeout(8000));
    if (failure) {
      if (action !== 'tick') setError(action === 'start'
        ? 'تعذر البدء. تأكد أن جميع اللاعبين فتحوا اللوبي ثم حاول مرة ثانية.'
        : 'تعذر تنفيذ الحركة. تحقق من الاتصال ثم حاول مرة ثانية.');
      return false;
    }
    if (action !== 'tick') setError('');
    accept(data, sent);
    return Boolean(data);
  }, [accept, available, code, playerId, register]);

  const live = board != null && !['lobby', 'ended', 'final'].includes(board.phase);
  const isPlayer = board?.players?.some(player => player.id === playerId) ?? false;
  useEffect(() => {
    if (!live || !isPlayer) return;
    const heartbeat = () => { if (!document.hidden) void call('tick'); };
    const timer = window.setInterval(heartbeat, 4000);
    document.addEventListener('visibilitychange', heartbeat);
    heartbeat();
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', heartbeat);
    };
  }, [call, isPlayer, live]);

  const endsAt = board?.endsAt;
  useEffect(() => {
    if (!isPlayer || !live || !endsAt) return;
    const timer = window.setTimeout(() => { if (!document.hidden) void call('tick'); },
      Math.max(60, endsAt - Date.now() - offset.current + 80));
    return () => window.clearTimeout(timer);
  }, [board?.serial, call, endsAt, isPlayer, live]);

  const configureMode = useCallback((mode: ArabicMode, duration: LetterRushDuration = 8) => call('configure', {
    mode: mode === 'letter-rush' ? 'letter' : 'classic',
    duration,
  }), [call]);

  return { board, available, error, call, configureMode, refresh, offset };
}
