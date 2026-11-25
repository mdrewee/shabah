import React from 'react';
export const resultCardId=(scope:string,id:string)=>`result-${scope}-${encodeURIComponent(id)}`;
export function ResultNavigator({scope,players,currentId,selectedId,onSelect}:{scope:string;players:Array<{id:string;name:string}>;currentId?:string;selectedId?:string;onSelect?:(id:string)=>void}){
  if(players.length<2)return null;
  const select=(id:string)=>{
    if(!id)return;
    if(onSelect){onSelect(id);return;}
    document.getElementById(resultCardId(scope,id))?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
  };
  return <nav aria-label="الوصول لنتائج اللاعبين" dir="rtl" className="my-3 flex w-full flex-wrap gap-2 text-sm">
    <label className="flex min-w-0 flex-1 items-center gap-2 text-zinc-300"><span className="shrink-0">نتائج اللاعبين</span><select aria-label="اختر متسابقًا لعرض نتيجته" value={selectedId ?? ''} onChange={event=>select(event.target.value)} className="min-h-11 min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-white"><option value="" disabled>اختر متسابقًا</option>{players.map(p=><option key={p.id} value={p.id}>{p.name}{p.id===currentId?' (أنت)':''}</option>)}</select></label>
    {currentId && players.some(p=>p.id===currentId) && <button type="button" onClick={()=>select(currentId)} className="min-h-11 rounded-xl border border-emerald-300/40 px-4 font-bold text-emerald-200">نتيجتي</button>}
  </nav>;
}
