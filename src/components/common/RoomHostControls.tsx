import { useConfirmation } from './ConfirmationProvider';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomBus } from '../../lib/roomBus';

export function RoomHostControls({ roomCode, syncEvent }: { roomCode: string; syncEvent: string }) {
  const confirm = useConfirmation();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('LOBBY');
  const [error, setError] = useState('');
  useEffect(() => roomBus.on(syncEvent, (event: any) => {
    const state = event?.data ?? event;
    if (state?.phase) setPhase(state.phase);
  }, roomCode), [roomCode, syncEvent]);
  if (phase === 'LOBBY') return null;
  return <nav aria-label="تحكم المضيف" dir="rtl" className="sticky top-0 z-50 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/15 bg-zinc-950/95 px-3 py-2 text-xs font-bold text-white backdrop-blur">
    <span className="text-zinc-400">المضيف · <bdi>{roomCode}</bdi></span>
    <div className="flex flex-wrap gap-2">
      {syncEvent !== 'JUDGE_STATE_SYNC' && ['JUDGING', 'CALCULATING', 'EVALUATING'].includes(phase) && <button type="button" onClick={() => window.location.reload()} className="min-h-10 rounded-xl border border-cyan-300/30 px-3 text-cyan-200">إعادة التحليل</button>}
      <button type="button" onClick={async () => {
        if (!await confirm('ترجع الجميع للوبي وتنهي الجولة الحالية؟')) return;
        setError('');
        if (!await roomBus.broadcastReturnToLobby(roomCode)) setError('تعذر الرجوع للوبي. جرّب مرة ثانية.');
      }} className="min-h-10 rounded-xl border border-white/20 px-3">العودة للوبي</button>
      <button type="button" onClick={async () => {
        if (!await confirm('تنهي الغرفة وتخرج جميع اللاعبين؟')) return;
        setError('');
        if (await roomBus.terminateRoom(roomCode)) navigate('/');
        else setError('تعذر إنهاء الغرفة. جرّب مرة ثانية.');
      }} className="min-h-10 rounded-xl border border-red-300/30 px-3 text-red-200">إنهاء الغرفة</button>
    </div>
    {error && <p role="alert" className="w-full text-amber-200">{error}</p>}
  </nav>;
}
