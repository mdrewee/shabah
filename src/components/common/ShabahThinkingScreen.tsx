import React, { useEffect, useState } from 'react';
import { ShabahGhost } from '../mascot/ShabahGhost';
import { useConfirmation } from './ConfirmationProvider';

const remarks = [
  'لحظة… الشبح يجمع الخيوط',
  'كل إجابة لها حكاية، خلّنا نسمعها',
  'فيه إجابة تستاهل نوقف عندها…',
  'الشبح يراجع حكمه قبل ما يعلنه',
];

export function ShabahThinkingScreen({ title = 'الشبح يحلّل الإجابات', onRetry, onReturnToLobby, failureMessage, onCancel }: {
  title?: string;
  onRetry?: () => void;
  onReturnToLobby?: () => void;
  failureMessage?: string;
  onCancel?:()=>void;
}) {
  const confirm = useConfirmation();
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section dir="rtl" role="status" aria-live="polite"
      className="grid min-h-[100dvh] w-full place-content-center overflow-hidden bg-[#080811] px-6 py-12 text-center text-white">
      <div className="relative mx-auto mb-7 grid h-52 w-52 place-items-center">
        <div aria-hidden="true" className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-600/25 via-cyan-400/15 to-green-400/20 blur-2xl motion-safe:animate-pulse" />
        <ShabahGhost mood="judging" className="relative h-44 w-44" trackPointer={false} />
      </div>
      <h2 className="text-2xl font-black sm:text-4xl">{title}</h2>
      <p className="mt-4 min-h-12 max-w-md text-sm leading-7 text-zinc-300">
        {failureMessage || (seconds >= 35 ? 'التحليل أخذ وقت أطول من المعتاد. ننتظر النتيجة، ويمكن للمضيف إعادة المحاولة أو الرجوع للوبي.' : remarks[Math.floor(seconds / 6) % remarks.length])}
      </p>
      <div aria-hidden="true" className="mt-6 flex justify-center gap-2">
        {[0, 1, 2].map((index) => <span key={index}
          className="h-2 w-2 rounded-full bg-cyan-200 motion-safe:animate-pulse"
          style={{ animationDelay: index * 250 + 'ms' }} />)}
      </div>
      <p className="mt-5 text-xs text-zinc-500">جمع الإجابات · مراجعة التفاصيل · تجهيز النتيجة</p>
      {(failureMessage || seconds >= 45) && onRetry && <button type="button" onClick={onRetry}
        className="mx-auto mt-6 rounded-xl border border-white/20 px-5 py-3 font-bold">إعادة المحاولة</button>}
      {failureMessage && onCancel && <button type="button" onClick={onCancel} className="mx-auto mt-4 rounded-xl border border-white/20 px-5 py-3 font-bold">إلغاء الجولة والمتابعة دون نقاط</button>}
      {onReturnToLobby && <button type="button" onClick={async () => {
        if (await confirm('ترجع الجميع للوبي وتنهي الجولة الحالية؟')) onReturnToLobby();
      }} className="mx-auto mt-4 min-h-12 rounded-xl border border-white/20 px-5 py-3 font-bold">العودة للوبي</button>}
    </section>
  );
}
