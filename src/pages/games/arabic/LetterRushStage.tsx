import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, RefObject } from 'react';
import { useParams } from 'react-router-dom';
import { Monitor, PencilLine, Volume2, VolumeX } from 'lucide-react';
import { ShabahGhost } from '../../../components/mascot/ShabahGhost';
import { sound } from '../../../lib/audio';
import { toArabicNumber } from '../../../utils/numberFormat';
import { LETTERS, rankLetterPlayers, useLetterRush } from './useLetterRush';
import type { LetterBoard, LetterPlayer } from './useLetterRush';
import './letterRush.css';

type GameActions = Pick<ReturnType<typeof useLetterRush>, 'call'>['call'];
const GHOST_COLORS = ['#B56BFF', '#38BDF8', '#4ADE80', '#BEF264', '#818CF8',
  '#FACC15', '#22D3EE', '#A855F7', '#FB7185', '#2DD4BF'];

function buzz(pattern: number | number[]) {
  try { navigator.vibrate?.(pattern); } catch {}
}

export function LetterRushStage({ board, offset, playerId, call, error, roomCode, onEnd }: {
  board: LetterBoard;
  offset: RefObject<number>;
  playerId?: string;
  call?: GameActions;
  error?: string;
  roomCode?: string;
  onEnd?: () => void;
}) {
  const [now, setNow] = useState(Date.now);
  const [muted, setMuted] = useState(() => sound.getMuted());
  const [editing, setEditing] = useState(false);
  const [target, setTarget] = useState('');
  const [busy, setBusy] = useState(false);
  const interaction = useRef(false);
  const lastTurn = useRef('');
  const lastWarning = useRef('');
  const lastEvent = useRef<number>();
  const players = board.players ?? [];
  const active = players.find(player => player.id === board.turn);
  const me = players.find(player => player.id === playerId);
  const isDisplay = !playerId;
  const isJudge = !isDisplay && board.judge === playerId;
  const isTurnPhase = board.phase === 'turn' || board.phase === 'ruling';
  const isTurn = board.phase === 'turn' && active?.id === playerId && !!me?.alive;
  const remaining = board.paused ?? Math.max(0, (board.endsAt ?? 0) - now - (offset.current ?? 0));
  const seconds = Math.ceil(remaining / 1000);
  const warning = board.phase === 'turn' && board.paused == null && seconds <= 2;
  const effect = board.event && now + (offset.current ?? 0) - board.event.at < 1050 ? board.event : null;
  const used = board.used ?? [];
  const exhausted = used.length === LETTERS.length;
  const pendingRuling = isJudge && isTurnPhase && Boolean(board.letter);
  const eventLabel = effect?.kind === 'correct' ? 'صح' : effect?.kind === 'wrong' ? 'خطأ · خروج من الجولة' : effect?.kind === 'skip' ? 'تخطينا الدور بعد انقطاع الاتصال' : '';
  const isOriginal = Boolean(roomCode && localStorage.getItem('shabah_host_' + roomCode));
  const lastOut = players.find(player => player.id === board.lastOut);
  const ghostColor = (id: string) => GHOST_COLORS[players.findIndex(player => player.id === id)] ?? GHOST_COLORS[0];

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const key = String(board.serial);
    if (!isTurn || lastTurn.current === key) return;
    lastTurn.current = key;
    if (interaction.current) sound.playNotification();
    buzz(75);
  }, [board.serial, isTurn]);

  useEffect(() => {
    const key = String(board.serial);
    if (!isTurn || !warning || !seconds || lastWarning.current === key) return;
    lastWarning.current = key;
    if (interaction.current) sound.playTick();
    buzz([35, 45, 35]);
  }, [board.serial, isTurn, seconds, warning]);

  useEffect(() => {
    if (!effect || lastEvent.current === effect.at) return;
    lastEvent.current = effect.at;
    if (effect.kind === 'correct' && interaction.current) sound.playCorrect();
    if (effect.kind === 'wrong') {
      if (interaction.current) sound.playIncorrect();
      if (effect.player === playerId) buzz([110, 45, 150]);
    }
  }, [effect, playerId]);

  useEffect(() => {
    if (board.phase === 'final' && interaction.current) sound.playVictory();
  }, [board.phase]);

  useEffect(() => {
    if (!isTurnPhase || !isJudge) setEditing(false);
  }, [isTurnPhase, isJudge]);

  const send = async (action: Parameters<GameActions>[0], details?: Record<string, unknown>) => {
    if (!call || busy) return false;
    interaction.current = true;
    setBusy(true);
    try {
      return await call(action, { serial: board.serial, letter: board.letter, ...details });
    } finally {
      setBusy(false);
    }
  };

  const openEdit = async () => {
    if (await send('pause_edit')) {
      setTarget('');
      setEditing(true);
    }
  };

  const closeEdit = async (action?: 'kick' | 'restore') => {
    if (action && !await send(action, { target })) return;
    if (await send('resume_edit')) setEditing(false);
  };

  const showGhost = (player: LetterPlayer, featured = false) => (
    <ShabahGhost trackPointer={false} className={featured ? 'letter-hero-ghost' : 'letter-mini-ghost'}
      mood={featured ? 'happy' : player.alive ? 'idle' : 'surprised'} />
  );

  return (
    <main dir="rtl" className={'letter-screen' + (isDisplay ? ' letter-display' : '')}
      style={isTurnPhase && active ? { '--letter-turn-color': ghostColor(active.id) } as CSSProperties : undefined}
      data-letter-tone={effect?.kind ?? (warning ? 'warning' : 'neutral')}
      onPointerDown={() => { interaction.current = true; }}>
      <div className="letter-shell">
        <header className="letter-top">
          <span className="letter-brand font-home-panorama">ضغط الحروف</span>
          {!isDisplay && (me?.alive || isJudge || isOriginal || board.phase === 'final') && <div className="letter-tools">
            {isOriginal && <a className="letter-button" href={`/display/letter-rush/${roomCode}`} target="_blank" rel="noreferrer"><Monitor size={16} />شاشة العرض</a>}
            {isOriginal && <button className="letter-button" type="button" disabled={busy} onClick={() => void send('lobby')}>العودة للوبي</button>}
            {onEnd && <button className="letter-button" type="button" disabled={busy} onClick={onEnd}>خروج</button>}
            <button type="button" className="letter-button" aria-label={muted ? 'تشغيل الصوت' : 'كتم الصوت'} aria-pressed={muted}
              onClick={() => { sound.setMuted(!muted); setMuted(!muted); if (muted) sound.playClick(); }}>
              {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
            </button>
          </div>}
        </header>
        {board.phase === 'final' ? (
          <section className="letter-final" aria-labelledby="letter-final-title">
            <ShabahGhost mood="happy" className="letter-final-ghost" trackPointer={false} />
            <p className="shabah-gradient-text">نهاية الجولات الثلاث</p>
            <h1 id="letter-final-title">الترتيب النهائي</h1>
            <ol>
              {rankLetterPlayers(players).map(player => (
                <li key={player.id} className={player.place === 1 ? 'letter-champion shabah-pill-wrap' : ''}>
                  <span>المركز {toArabicNumber(player.place)}</span><bdi>{player.name}</bdi><strong>{toArabicNumber(player.score)} نقاط</strong>
                </li>
              ))}
            </ol>
          </section>
        ) : board.phase === 'preview' ? (
          <section className="letter-intermission">
            <p>الجولة {toArabicNumber(board.round ?? 1)} / ٣</p>
            <div className="letter-question"><h1>{board.question}</h1></div>
            <strong className="letter-phase-clock" aria-label="الوقت قبل أول دور">{toArabicNumber(seconds)}</strong>
          </section>
        ) : board.phase === 'review' ? (
          <section className="letter-intermission">
            <p>الجولة {toArabicNumber(board.round ?? 1)} / ٣</p>
            <h1>{isJudge ? <>آخر لاعب خرج: <bdi>{lastOut?.name}</bdi></> : 'جاري التأكيد...'}</h1>
            <strong className="letter-phase-clock">{toArabicNumber(seconds)}</strong>
            {isJudge && <div className="letter-judgment">
              <button type="button" className="letter-button letter-correct" disabled={busy} onClick={() => void send('finish')}>تأكيد النهاية</button>
              <button type="button" className="letter-button" disabled={busy || !seconds} onClick={() => void send('restore_final')}>إرجاع اللاعب</button>
            </div>}
          </section>
        ) : board.phase === 'between' ? (
          <section className="letter-final letter-intermission">
            <p>الجولة {toArabicNumber(board.round ?? 1)} / ٣</p>
            <h1>{board.round === 3 ? 'الترتيب النهائي بعد قليل' : 'الجولة التالية بعد قليل'}</h1>
            <strong className="letter-phase-clock">{toArabicNumber(seconds)}</strong>
            <ol aria-label="النقاط الحالية">
              {rankLetterPlayers(players).map(player => <li key={player.id}>
                <span>المركز {toArabicNumber(player.place)}</span><bdi>{player.name}</bdi><strong>{toArabicNumber(player.score)} نقاط</strong>
              </li>)}
            </ol>
          </section>
        ) : (
          <>
            <section className="letter-turn">
              <div className="letter-feature">
                {active ? <>
                  <div className="letter-feature-name">
                    <span>{isTurn ? 'دورك' : 'عليه الدور'}</span>
                    <strong><bdi>{active.name}</bdi></strong>
                  </div>
                  <div className="letter-ghost-ring" style={{ '--letter-player-color': ghostColor(active.id) } as CSSProperties}>{showGhost(active, true)}</div>
                </> : null}
              </div>
              <div className="letter-clock">
                <span>الجولة {toArabicNumber(board.round ?? 1)} / ٣</span>
                <strong aria-label={board.paused != null ? 'الوقت متوقف' : 'وقت الإجابة'}>{toArabicNumber(seconds)}</strong>
              </div>
            </section>
            <section className="letter-question">
              <h1>{board.question}</h1>
              <p aria-live="polite">{eventLabel || (board.paused != null ? 'الوقت متوقف'
                : exhausted ? 'استخدمتم كل الحروف'
                : !isDisplay && !me?.alive ? 'أنت الآن متفرج'
                : board.letter ? `الحرف المختار: ${board.letter}` : isTurn ? 'اختر حرف وقل إجابتك بصوتك' : '')}</p>
            </section>
            <div className="letter-grid" aria-label="لوحة الحروف">
              {LETTERS.map(letter => (
                <button type="button" key={letter} aria-label={used.includes(letter) ? `${letter} مستخدم` : letter}
                  aria-pressed={board.letter === letter} data-used={used.includes(letter) || undefined}
                  disabled={isDisplay || !isTurn || !!board.letter || used.includes(letter) || busy || !seconds || board.paused != null}
                  onClick={() => { sound.playClick(); void send('letter', { letter }); }}>{letter}</button>
              ))}
            </div>
            {isJudge && !editing && <button type="button" className="letter-button letter-edit-trigger"
              disabled={busy || !seconds} onClick={() => void openEdit()}><PencilLine size={18} /> تعديل</button>}
            <ul className="letter-roster" aria-label="المتسابقون">
              {players.map(player => (
                <li key={player.id} data-eliminated={!player.alive || undefined} data-playing={active?.id === player.id || undefined}
                  style={{ '--letter-player-color': ghostColor(player.id) } as CSSProperties}>
                  <bdi>{player.name}</bdi>
                  <div className="letter-roster-ghost" data-fly={effect?.kind === 'wrong' && effect.player === player.id || undefined}>
                    {showGhost(player)}
                  </div>
                  <span>{toArabicNumber(player.score)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        {error && <p role="alert" className="letter-error">{error}</p>}
      </div>
      {pendingRuling && !editing && <div className="letter-overlay">
        <section role="dialog" aria-modal="true" aria-labelledby="letter-ruling-title" className="letter-dialog">
          <h2 id="letter-ruling-title"><bdi>{active?.name}</bdi> اختار</h2>
          <strong className="letter-ruling-glyph">{board.letter}</strong>
          <p>{board.paused != null ? 'الوقت متوقف' : `${toArabicNumber(seconds)} ث`}</p>
          <div className="letter-judgment">
            <button className="letter-button letter-correct" type="button" disabled={busy} onClick={() => void send('correct')}>صح</button>
            <button className="letter-button letter-wrong" type="button" disabled={busy} onClick={() => void send('wrong')}>خطأ</button>
          </div>
          {error && <p role="alert" className="letter-error">{error}</p>}
        </section>
      </div>}
      {editing && isJudge && isTurnPhase && <div className="letter-overlay">
        <section role="dialog" aria-modal="true" aria-labelledby="letter-edit-title" className="letter-dialog"
          onKeyDown={event => { if (event.key === 'Escape' && !busy) void closeEdit(); }}>
          <h2 id="letter-edit-title">تعديل الدور</h2>
          <p role="status">{board.paused != null ? `الوقت متوقف عند ${toArabicNumber(seconds)} ث` : 'الوقت مستمر'}</p>
          <div className="letter-edit-list">
            {players.map(player => <button className="letter-button" type="button" key={player.id}
              aria-pressed={target === player.id} onClick={() => setTarget(player.id)}><bdi>{player.name}</bdi></button>)}
          </div>
          <div className="letter-judgment">
            {target && <>
              <button className="letter-button letter-wrong" type="button" disabled={busy || !players.find(player => player.id === target)?.alive}
                onClick={() => void closeEdit('kick')}>طرد</button>
              <button className="letter-button letter-correct" type="button" disabled={busy}
                onClick={() => void closeEdit('restore')}>إرجاع</button>
              <button className="letter-button" type="button" disabled={busy}
                onClick={() => board.paused == null ? void send('pause_edit') : void closeEdit()}>{board.paused != null ? 'استئناف الوقت' : 'إيقاف الوقت'}</button>
            </>}
            <button className="letter-button" type="button" disabled={busy} onClick={() => void closeEdit()}>تم</button>
          </div>
        </section>
      </div>}
    </main>
  );
}

export function LetterRushDisplay() {
  const { code = '' } = useParams();
  const { board, offset, available, error, refresh } = useLetterRush(code.toUpperCase());
  if (board && !['lobby', 'ended'].includes(board.phase)) return <LetterRushStage board={board} offset={offset} />;
  return <main dir="rtl" className="letter-screen letter-display letter-wait">
    <ShabahGhost className="letter-final-ghost" trackPointer={false} />
    <p role="status">{board?.phase === 'ended' ? 'انتهت الغرفة' : !available ? 'شاشة العرض غير متاحة الآن'
      : error || (board === undefined ? 'جاري تحميل الغرفة…' : 'بانتظار بدء الجولة من جوال المضيف')}</p>
    {error && <button type="button" className="letter-button" onClick={() => void refresh()}>إعادة المحاولة</button>}
    <bdi>{code.toUpperCase()}</bdi>
  </main>;
}
