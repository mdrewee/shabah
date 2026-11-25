import React,{useEffect,useState} from 'react';

export function roundLeaders(entries:Array<{name:string;score:number;eligible?:boolean}>){
  const eligible=entries.filter(e=>e.eligible!==false && Number.isFinite(e.score) && e.score>0);
  const best=Math.max(0,...eligible.map(e=>e.score));
  return eligible.filter(e=>e.score===best).map(e=>e.name);
}
export function RoundCelebration({names,award}:{names:string[];award:string}){
  const [burst,setBurst]=useState(true),identity=names.join('|');
  useEffect(()=>{setBurst(true);const timer=setTimeout(()=>setBurst(false),1800);return()=>clearTimeout(timer);},[identity,award]);
  if(!names.length)return null;
  return <aside aria-label="لقب الجولة" dir="rtl" className="relative my-3 w-full overflow-hidden rounded-2xl border border-amber-300/30 bg-amber-300/5 p-4 text-center text-white">
    {burst && <div aria-hidden="true" className="pointer-events-none absolute inset-0">{Array.from({length:12},(_,i)=><span key={i} className="shabah-confetti absolute top-0 h-2 w-1 rounded-sm" style={{left:`${5+i*8}%`,background:['#c4a1ff','#6ee7b7','#fcd34d'][i%3],animationDelay:`${i%4*80}ms`}}/>)}</div>}
    <p className="text-xs font-bold text-amber-200">{names.length>1?'لقب مشترك · ':''}{award}</p><p className="mt-1 break-words text-lg font-black">{names.join(' و ')}</p>
  </aside>;
}
