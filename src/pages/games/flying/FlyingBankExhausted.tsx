import React from 'react';
export function FlyingBankExhausted({ onExit }: { onExit: () => void }) {
  return <main dir="rtl" className="grid min-h-[100dvh] place-content-center gap-5 bg-zinc-950 p-6 text-center text-white">
    <h1 className="text-2xl font-black">خلصتم جميع أسئلة البنك المتاحة لهذه الأجهزة!</h1>
    <p>توقفنا حتى ما نكرر سؤال سبق ظهوره. بنك الأسئلة محفوظ على الجهاز.</p>
    <button type="button" onClick={onExit} className="rounded-xl bg-white px-5 py-3 font-bold text-black">العودة للرئيسية</button>
  </main>;
}
