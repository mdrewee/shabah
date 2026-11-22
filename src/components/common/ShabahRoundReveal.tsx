import React, { useEffect, useState } from 'react';
import { ShabahGhost } from '../mascot/ShabahGhost';

export function ShabahRoundReveal({ entries, children }: {
  entries: Array<{ id: string; name: string; answer: string }>;
  children: React.ReactNode;
}) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    setStep(0);
    if (!entries.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStep(entries.length + 1);
      return;
    }
    const timer = window.setInterval(() => setStep((value) => {
      if (value >= entries.length) window.clearInterval(timer);
      return value + 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [entries.length]);

  if (!entries.length || step > entries.length) return <>{children}</>;
  return (
    <section dir="rtl" className="grid min-h-[75dvh] w-full place-content-center gap-5 bg-[#080811] p-6 text-center text-white">
      <ShabahGhost mood="judging" className="mx-auto h-28 w-28" trackPointer={false} />
      <h2 role="status" className="text-2xl font-black">
        {step === entries.length ? 'جاهزين نعرف النتيجة؟' : 'خلّونا نشوف إجاباتكم…'}
      </h2>
      <div className="grid max-h-[45dvh] max-w-3xl gap-3 overflow-y-auto sm:grid-cols-2">
        {entries.slice(0, step + 1).map((entry) => (
          <article key={entry.id} className="rounded-2xl border border-white/15 bg-white/5 p-4 motion-safe:animate-in motion-safe:fade-in">
            <h3 className="mb-2 font-bold text-cyan-200">{entry.name}</h3>
            <p className="text-sm leading-7 text-zinc-300">{entry.answer || 'لم يرسل إجابة'}</p>
          </article>
        ))}
      </div>
      <button type="button" onClick={() => setStep(entries.length + 1)}
        className="mx-auto rounded-xl border border-white/20 px-5 py-3 font-bold">عرض النتيجة</button>
    </section>
  );
}
